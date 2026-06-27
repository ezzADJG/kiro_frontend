# Plan: Invitación de usuarios (tipo YaVendió)

## Flujo completo

```
Owner ingresa email → RTDB: invitations/{businessId}/{pushId}
  → Cloud Function onInvitationCreate
    → Genera token aleatorio + invitationTokens/{token}
    → Resend API: envía email con link https://kiro.app/invitar?token=XXX
    → invitation.status = 'sent'

Usuario hace clic → /invitar?token=XXX (página pública)
  → Lee invitationTokens/{token} → consigue businessId + inviteId
  → Muestra "Has sido invitado a [BusinessName]"
  → Click "Aceptar" → llama acceptInvitation({ token, nombre })
    → Valida token, no expirado, no usado
    → Admin SDK: createUser({ email, password: tempPassword })
    → Escribe businessUsers/{businessId}/{uid}
    → Escribe userBusinesses/{uid}/{businessId}
    → Resend: email con contraseña temporal
    → invitation.status = 'accepted'
    → Devuelve { tempPassword }
  → Frontend: signInWithEmailAndPassword(email, tempPassword)
  → Redirige a /dashboard
```

## Tareas

### Fase 1 — Frontend (React)

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `types/business.ts` | Unificar tipos: `UserBusinessMembership.role = 'owner' \| 'agente'` (ya está bien, no tocar) |
| 2 | `types/index.ts` | Eliminar `BusinessRole` duplicado (`'owner' \| 'agent' \| 'admin'`), reemplazar usos con el tipo de `business.ts` |
| 3 | `lib/db.ts` | Agregar `invitationsRef(businessId)`, `invitationTokenRef(token)` helpers |
| 4 | `services/businessService.ts` | `invitarUsuario(businessId, email, role)`, `obtenerUsuariosDeNegocio(businessId)`, `obtenerPerfilesDeUsuarios(uids[])`, `eliminarUsuarioDeNegocio(businessId, uid)` |
| 5 | `pages/Equipo.tsx` | Nueva: lista miembros (`businessUsers/{businessId}` + `users/{uid}`), formulario invitar por email, columna rol/estado, botón eliminar |
| 6 | `pages/AceptarInvitacion.tsx` | Nueva: pública, ruta `/invitar?token=XXX`, muestra info del negocio, botón "Aceptar" con input de nombre, llama `acceptInvitation` |
| 7 | `App.tsx` | Ruta pública `/invitar`, ruta protegida `/dashboard/equipo` |
| 8 | `Sidebar.tsx` | Agregar icono `Users` para "Equipo" |
| 9 | `components/Chats.tsx` | Sin cambios |

### Fase 2 — Cloud Functions (`functions/`)

| # | Archivo | Acción |
|---|---------|--------|
| 10 | `functions/package.json` | `firebase-functions`, `firebase-admin`, `resend` |
| 11 | `functions/tsconfig.json` | Config TS estándar para Functions |
| 12 | `functions/src/index.ts` | `onInvitationCreate` (RTDB trigger) + `acceptInvitation` (Callable) |
| 13 | `functions/.env.example` | `RESEND_API_KEY=re_xxx` |

### Fase 3 — RTDB Security Rules

| # | Archivo | Acción |
|---|---------|--------|
| 14 | `database.rules.json` | `invitationTokens/{token}` readable sin auth (es secreto por token), `invitations/` solo auth, más el resto de reglas existentes |

## RTDB estructura nueva

```
invitations/
  {businessId}/
    {inviteId}/
      email: "user@example.com"
      role: "agente"          // 'agente' | 'owner'
      businessName: "Mi Negocio"
      status: "pending" | "sent" | "accepted" | "expired"
      token: "abc123def456"
      createdAt: 1234567890

invitationTokens/
  {token}/
    businessId: "{businessId}"
    inviteId: "{inviteId}"
```

## Especificaciones Cloud Functions

### `onInvitationCreate` (RTDB trigger)

```typescript
exports.onInvitationCreate = functions.database
  .ref('/invitations/{businessId}/{inviteId}')
  .onCreate(async (snapshot, context) => { ... })
```

- Lee `{ email, role, businessId, businessName }` del snapshot
- Genera token: `crypto.randomBytes(32).toString('hex')`
- Escribe `invitationTokens/{token}` → `{ businessId, inviteId: context.params.inviteId }`
- Actualiza `invitations/{businessId}/{inviteId}` → `{ status: 'sent', token }`
- Envía email vía Resend:
  ```
  Asunto: Has sido invitado a [BusinessName]
  Cuerpo: Has sido invitado a unirte a [BusinessName] en Kiro.
  Haz clic aquí para aceptar: https://kiro.app/invitar?token=[TOKEN]
  ```

### `acceptInvitation` (Callable Function)

```typescript
exports.acceptInvitation = functions.https.onCall(async (data, context) => { ... })
```

- Recibe `{ token, nombre }`
- Lee `invitationTokens/{token}` → obtiene `businessId, inviteId`
- Lee `invitations/{businessId}/{inviteId}` → valida `status === 'sent'`
- Genera `tempPassword: crypto.randomBytes(6).toString('hex')` (12 chars alfanumérico)
- `admin.auth().createUser({ email, password: tempPassword, displayName: nombre })`
- Escribe `businessUsers/{businessId}/{uid}` → `{ role, active, joinedAt }`
- Escribe `userBusinesses/{uid}/{businessId}` → `{ role, active, joinedAt }`
- Actualiza `invitations/{businessId}/{inviteId}` → `{ status: 'accepted', acceptedAt }`
- Elimina `invitationTokens/{token}` (opcional, por limpieza)
- Devuelve `{ email, tempPassword }`
- Maneja errores: token inválido, ya usado, expirado (>72h), email ya registrado

## Notas técnicas

- `signInWithEmailAndPassword` del frontend usa el `tempPassword` retornado por la Callable Function para auto-login inmediato.
- La página `/invitar` NO requiere autenticación. Lee `invitationTokens/{token}` que tiene `.read: true` en reglas (seguro porque el token es secreto de 64 chars hex).
- `asegurarPerfilUsuario()` en `AuthContext` corre automáticamente en el primer login y crea `users/{uid}`.
- `BusinessContext.refrescarNegocios()` ya existe y se llama al cargar el dashboard.

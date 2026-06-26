import {
  ref,
  query,
  orderByChild,
  equalTo,
  onValue,
  off,
  type Unsubscribe,
} from 'firebase/database'
import { db } from './firebase'

export function businessConversationsRef(businessId: string) {
  return ref(db, `businessConversations/${businessId}`)
}

export function conversationMessagesRef(conversationId: string) {
  return ref(db, `conversationMessages/${conversationId}`)
}

export function userBusinessRef(uid: string) {
  return ref(db, `userBusinesses/${uid}`)
}

export function phonesNoMetaIdRef() {
  return ref(db, 'phonesNoMetaId')
}

export function phoneNoMetaIdRef(id: string) {
  return ref(db, `phonesNoMetaId/${id}`)
}

export function phonesRef() {
  return ref(db, 'phones')
}

export function phoneRef(id: string) {
  return ref(db, `phones/${id}`)
}

export function businessUsersRef(businessId: string) {
  return ref(db, `businessUsers/${businessId}`)
}

export function invitationsRef(businessId: string) {
  return ref(db, `invitations/${businessId}`)
}

export function invitationTokenRef(token: string) {
  return ref(db, `invitationTokens/${token}`)
}

export function subscribeConversations(
  businessId: string,
  callback: (data: Record<string, any> | null) => void
): Unsubscribe {
  const dbRef = businessConversationsRef(businessId)
  const unsubscribe = onValue(dbRef, (snapshot) => {
    callback(snapshot.val())
  })
  return () => {
    off(dbRef)
    unsubscribe()
  }
}

export function subscribeMessages(
  conversationId: string,
  callback: (data: Record<string, any> | null) => void
): Unsubscribe {
  const dbRef = conversationMessagesRef(conversationId)
  const unsubscribe = onValue(dbRef, (snapshot) => {
    callback(snapshot.val())
  })
  return () => {
    off(dbRef)
    unsubscribe()
  }
}

export function subscribeBusinessPhones(
  businessId: string,
  callback: (data: Record<string, any> | null) => void
): Unsubscribe {
  const dbRef = query(
    ref(db, 'phones'),
    orderByChild('business_id'),
    equalTo(businessId)
  )
  const unsubscribe = onValue(dbRef, (snapshot) => {
    callback(snapshot.val())
  })
  return () => {
    off(dbRef)
    unsubscribe()
  }
}

export async function fetchUserBusiness(uid: string) {
  const dbRef = userBusinessRef(uid)
  return new Promise<{ businessId: string; role: string } | null>((resolve) => {
    onValue(
      dbRef,
      (snapshot) => {
        const val = snapshot.val()
        resolve(val)
      },
      { onlyOnce: true }
    )
  })
}

import {
  ref,
  query,
  orderByChild,
  equalTo,
  onValue,
  off,
  push,
  update,
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

export function salesRef(businessId: string) {
  return ref(db, `sales/${businessId}`)
}

export function saleRef(businessId: string, saleId: string) {
  return ref(db, `sales/${businessId}/${saleId}`)
}

export function customersRef(businessId: string) {
  return ref(db, `customers/${businessId}`)
}

export function customerRef(businessId: string, customerId: string) {
  return ref(db, `customers/${businessId}/${customerId}`)
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

export function subscribeSales(
  businessId: string,
  callback: (data: Record<string, any> | null) => void
): Unsubscribe {
  const dbRef = salesRef(businessId)
  const unsubscribe = onValue(dbRef, (snapshot) => {
    callback(snapshot.val())
  })
  return () => {
    off(dbRef)
    unsubscribe()
  }
}

export function preordersRef(businessId: string) {
  return ref(db, `preorders/${businessId}`)
}

export function preorderRef(businessId: string, preorderId: string) {
  return ref(db, `preorders/${businessId}/${preorderId}`)
}

export function subscribePreorders(
  businessId: string,
  callback: (data: Record<string, any> | null) => void
): Unsubscribe {
  const dbRef = preordersRef(businessId)
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

export function productsRef(businessId: string) {
  return ref(db, `products/${businessId}`)
}

export function productRef(businessId: string, productId: string) {
  return ref(db, `products/${businessId}/${productId}`)
}

export function servicesRef(businessId: string) {
  return ref(db, `services/${businessId}`)
}

export function serviceRef(businessId: string, serviceId: string) {
  return ref(db, `services/${businessId}/${serviceId}`)
}

export function shippingConfigRef(businessId: string) {
  return ref(db, `conf_envios/${businessId}/shippingConfig`)
}

export function subscribeProducts(
  businessId: string,
  callback: (data: Record<string, any> | null) => void
): Unsubscribe {
  const dbRef = productsRef(businessId)
  const unsubscribe = onValue(dbRef, (snapshot) => {
    callback(snapshot.val())
  })
  return () => {
    off(dbRef)
    unsubscribe()
  }
}

export function subscribeBusinessType(
  industry: string,
  callback: (data: any | null) => void
): Unsubscribe {
  const dbRef = ref(db, `businessTypes/${industry}`)
  const unsubscribe = onValue(dbRef, (snapshot) => {
    callback(snapshot.val())
  })
  return () => {
    off(dbRef)
    unsubscribe()
  }
}

export function createProduct(
  businessId: string,
  data: Record<string, any>
) {
  const dbRef = productsRef(businessId)
  return push(dbRef, data)
}

export function updateProduct(
  businessId: string,
  productId: string,
  data: Record<string, any>
) {
  return update(productRef(businessId, productId), data)
}

export function subscribeServices(
  businessId: string,
  callback: (data: Record<string, any> | null) => void
): Unsubscribe {
  const dbRef = servicesRef(businessId)
  const unsubscribe = onValue(dbRef, (snapshot) => {
    callback(snapshot.val())
  })
  return () => {
    off(dbRef)
    unsubscribe()
  }
}

export function createService(
  businessId: string,
  data: Record<string, any>
) {
  const dbRef = servicesRef(businessId)
  return push(dbRef, data)
}

export function updateService(
  businessId: string,
  serviceId: string,
  data: Record<string, any>
) {
  return update(serviceRef(businessId, serviceId), data)
}

import { ref, onValue, off, type Unsubscribe } from 'firebase/database'
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

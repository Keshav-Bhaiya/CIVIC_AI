import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          setUser({ ...firebaseUser, profile: snap.exists() ? snap.data() : null })
        } catch {
          setUser({ ...firebaseUser, profile: null })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function createUserDocument(firebaseUser, extraData = {}) {
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || extraData.name || '',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || '',
        createdAt: serverTimestamp(),
        role: 'citizen',
        points: 0,
        ...extraData,
      })
    }
    return ref
  }

  async function signUpWithEmail(email, password, name) {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(firebaseUser, { displayName: name })
    await createUserDocument(firebaseUser, { name })
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    setUser({ ...firebaseUser, displayName: name, profile: snap.data() })
    return firebaseUser
  }

  async function signInWithEmail(email, password) {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    setUser({ ...firebaseUser, profile: snap.exists() ? snap.data() : null })
    return firebaseUser
  }

  async function signInWithGoogle() {
    const { user: firebaseUser } = await signInWithPopup(auth, googleProvider)
    await createUserDocument(firebaseUser)
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    setUser({ ...firebaseUser, profile: snap.exists() ? snap.data() : null })
    return firebaseUser
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
  }

  const value = {
    user,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

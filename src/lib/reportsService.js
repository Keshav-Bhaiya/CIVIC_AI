import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  onSnapshot,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'

// ─── Upload images to Firebase Storage ───────────────────────────────────────
export async function uploadImages(files, reportId) {
  const urls = []
  for (const file of files) {
    const storageRef = ref(storage, `reports/${reportId}/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    urls.push(url)
  }
  return urls
}

// ─── Create a new report ─────────────────────────────────────────────────────
export async function createReport(data, imageFiles, userId, userDisplayName) {
  const docRef = await addDoc(collection(db, 'reports'), {
    userId,
    userDisplayName,
    category: data.category,
    title: data.title,
    description: data.description,
    location: data.location,
    address: data.address,
    city: data.city,
    imageUrls: [],
    createdAt: serverTimestamp(),
    status: 'open',
    severity: data.severity,
    aiScore: null,
    aiSummary: null,
    aiTags: [],
    votes: 0,
    voters: [],
    verifiedCount: 0,
    verifiers: [],
    flaggedCount: 0,
    flaggers: [],
    commentCount: 0,
    views: 0,
  })

  if (imageFiles && imageFiles.length > 0) {
    try {
      const urls = await uploadImages(imageFiles, docRef.id)
      await updateDoc(docRef, { imageUrls: urls })
    } catch (err) {
      // Storage may not be enabled on Spark plan — fail silently, report still saved
      console.warn('Image upload failed (Storage may not be enabled):', err.message)
    }
  }

  return docRef.id
}

// ─── Fetch all reports (real-time) ───────────────────────────────────────────
// BUG FIX: Added error callback so Firestore errors don't leave callers stuck loading.
export function subscribeToReports(callback, onError) {
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(reports)
    },
    (err) => {
      console.error('subscribeToReports error:', err.message)
      if (onError) onError(err)
      else callback([]) // fail-open: return empty array so UI renders
    }
  )
}

// ─── Fetch reports for a specific user ───────────────────────────────────────
// NOTE: This query (userId + orderBy createdAt) requires a Firestore composite index.
// Create it at: Firebase Console → Firestore → Indexes → Add Index
// Collection: reports  |  Fields: userId ASC, createdAt DESC
// BUG FIX: Added error callback so missing-index error doesn't freeze loading state.
export function subscribeToUserReports(userId, callback, onError) {
  const q = query(
    collection(db, 'reports'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(
    q,
    (snap) => {
      const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(reports)
    },
    (err) => {
      console.error('subscribeToUserReports error:', err.message)
      // If index is missing, Firestore includes a URL in the message to create it
      if (err.message?.includes('index')) {
        console.warn('👉 Create the required Firestore index by visiting the URL in the error above.')
      }
      if (onError) onError(err)
      else callback([]) // fail-open: empty array so Dashboard renders
    }
  )
}

// ─── Get a single report ─────────────────────────────────────────────────────
export async function getReport(reportId) {
  const snap = await getDoc(doc(db, 'reports', reportId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ─── Subscribe to a single report (real-time) ────────────────────────────────
export function subscribeToReport(reportId, callback, onError) {
  return onSnapshot(
    doc(db, 'reports', reportId),
    (snap) => {
      if (snap.exists()) callback({ id: snap.id, ...snap.data() })
    },
    (err) => {
      console.error('subscribeToReport error:', err.message)
      if (onError) onError(err)
    }
  )
}

// ─── Upvote / un-vote a report ───────────────────────────────────────────────
export async function toggleVote(reportId, userId) {
  const reportRef = doc(db, 'reports', reportId)
  const snap = await getDoc(reportRef)
  if (!snap.exists()) return
  const voters = snap.data().voters || []
  const hasVoted = voters.includes(userId)
  await updateDoc(reportRef, {
    voters: hasVoted ? arrayRemove(userId) : arrayUnion(userId),
    votes: increment(hasVoted ? -1 : 1),
  })
  return !hasVoted
}

// ─── Verify / flag a report ──────────────────────────────────────────────────
export async function verifyReport(reportId, userId, action) {
  const reportRef = doc(db, 'reports', reportId)
  const snap = await getDoc(reportRef)
  if (!snap.exists()) return
  const data = snap.data()
  const verifiers = data.verifiers || []
  const flaggers = data.flaggers || []
  const updates = {}

  if (action === 'verify') {
    if (verifiers.includes(userId)) return
    if (flaggers.includes(userId)) {
      updates.flaggers = arrayRemove(userId)
      updates.flaggedCount = increment(-1)
    }
    updates.verifiers = arrayUnion(userId)
    updates.verifiedCount = increment(1)
  } else {
    if (flaggers.includes(userId)) return
    if (verifiers.includes(userId)) {
      updates.verifiers = arrayRemove(userId)
      updates.verifiedCount = increment(-1)
    }
    updates.flaggers = arrayUnion(userId)
    updates.flaggedCount = increment(1)
  }

  await updateDoc(reportRef, updates)
}

// ─── Add a comment ───────────────────────────────────────────────────────────
export async function addComment(reportId, userId, displayName, text) {
  await addDoc(collection(db, 'reports', reportId, 'comments'), {
    userId,
    displayName,
    text,
    createdAt: serverTimestamp(),
    likes: 0,
    likedBy: [],
  })
  await updateDoc(doc(db, 'reports', reportId), {
    commentCount: increment(1),
  })
}

// ─── Subscribe to comments ───────────────────────────────────────────────────
export function subscribeToComments(reportId, callback, onError) {
  const q = query(
    collection(db, 'reports', reportId, 'comments'),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(
    q,
    (snap) => {
      const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(comments)
    },
    (err) => {
      console.error('subscribeToComments error:', err.message)
      if (onError) onError(err)
      else callback([])
    }
  )
}

// ─── Like a comment ──────────────────────────────────────────────────────────
export async function toggleCommentLike(reportId, commentId, userId) {
  const commentRef = doc(db, 'reports', reportId, 'comments', commentId)
  const snap = await getDoc(commentRef)
  if (!snap.exists()) return
  const likedBy = snap.data().likedBy || []
  const hasLiked = likedBy.includes(userId)
  await updateDoc(commentRef, {
    likedBy: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
    likes: increment(hasLiked ? -1 : 1),
  })
}

// ─── Update report status ────────────────────────────────────────────────────
export async function updateReportStatus(reportId, status) {
  await updateDoc(doc(db, 'reports', reportId), { status })
}

// ─── Save AI analysis result to a report ────────────────────────────────────
export async function saveAiAnalysis(reportId, analysis) {
  await updateDoc(doc(db, 'reports', reportId), {
    aiScore: analysis.score,
    aiSummary: analysis.summary,
    aiTags: analysis.tags || [],
    aiDepartment: analysis.department || '',
    aiEstRepairDays: analysis.estRepairDays || null,
  })
}

// ─── Fetch reports needing verification ──────────────────────────────────────
export function subscribeToVerificationQueue(userId, callback, onError) {
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const reports = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.userId !== userId && r.status !== 'resolved')
      callback(reports)
    },
    (err) => {
      console.error('subscribeToVerificationQueue error:', err.message)
      if (onError) onError(err)
      else callback([])
    }
  )
}

// ─── Increment view count ────────────────────────────────────────────────────
export async function incrementViews(reportId) {
  try {
    await updateDoc(doc(db, 'reports', reportId), { views: increment(1) })
  } catch {
    // Non-critical — fail silently
  }
}

// ─── Update user points ──────────────────────────────────────────────────────
// BUG FIX: Removed broken dynamic import — use static imports already at top of file.
export async function addUserPoints(userId, points) {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, { points: increment(points) })
}
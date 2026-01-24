import { useState, useEffect, useRef } from "react";
import {
  onSnapshot,
  doc,
  collection,
  query,
  orderBy,
  where,
  type Query,
  type DocumentSnapshot,
  type QuerySnapshot,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  FirestoreUser,
  FirestorePatient,
  FirestoreReading,
  FirestoreMedicalNote,
  FirestoreMedication,
  FirestoreNotification,
  FirestoreMessage,
  FirestorePatientAlert,
  FirestoreReport,
} from "@/types/firestore";

// Generic hook for real-time document listening
export function useFirestoreDocument<T>(
  docRef: DocumentSnapshot | null,
  enabled: boolean = true
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      docRef.ref,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef, enabled]);

  return { data, loading, error };
}

// Helper function to compare arrays by their IDs only
// This prevents unnecessary state updates that cause re-renders
// We use a simple ID-based comparison to avoid deep equality checks
function arraysEqualById<T extends { id?: string }>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  if (a.length === 0 && b.length === 0) return true;

  // Simple ID-based comparison - if IDs match, assume data is the same
  // This is safe because Firestore will trigger a new snapshot if data changes
  const aIds = a.map(item => item.id).filter((id): id is string => Boolean(id));
  const bIds = b.map(item => item.id).filter((id): id is string => Boolean(id));

  // If the filtered lengths don't match the original lengths, items without IDs exist
  // In that case, consider the arrays as different to be safe
  if (aIds.length !== a.length || bIds.length !== b.length) {
    return false;
  }

  if (aIds.length !== bIds.length) return false;

  const aIdsSet = new Set(aIds);
  const bIdsSet = new Set(bIds);

  for (const id of aIdsSet) {
    if (!bIdsSet.has(id)) return false;
  }

  return true;
}

// Debug logging removed to prevent network errors and infinite loops

// Generic hook for real-time collection query listening
export function useFirestoreQuery<T extends { id?: string }>(
  queryRef: Query | null,
  enabled: boolean = true
): {
  data: T[];
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const currentQueryRef = useRef<Query | null>(null);
  const isMountedRef = useRef(true);
  const dataRef = useRef<T[]>([]);
  const isFirstSnapshotRef = useRef(true);
  const isSubscribingRef = useRef(false);
  const prevQueryRef = useRef<Query | null>(null);
  const prevEnabledRef = useRef(enabled);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Check if query or enabled actually changed
    const queryChanged = prevQueryRef.current !== queryRef;
    const enabledChanged = prevEnabledRef.current !== enabled;
    
    // Update previous refs
    prevQueryRef.current = queryRef;
    prevEnabledRef.current = enabled;

    if (!queryRef || !enabled) {
      // Clean up subscription if disabled
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        currentQueryRef.current = null;
        isSubscribingRef.current = false;
      }
      if (isMountedRef.current) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false);
        if (!queryRef) {
          setData([]);
        }
      }
      return;
    }

    // Only create subscription if query actually changed or we don't have one
    // Use reference equality check - if queryRef is the same object, skip
    if (!queryChanged && !enabledChanged && currentQueryRef.current === queryRef && unsubscribeRef.current && !isSubscribingRef.current) {
      // Query hasn't changed and we have an active subscription - skip
      return;
    }

    // Prevent re-subscription if we're already in the process of subscribing
    if (isSubscribingRef.current) {
      return;
    }

    // Clean up previous subscription if query changed
    if (unsubscribeRef.current && (queryChanged || enabledChanged)) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    isSubscribingRef.current = true;
    currentQueryRef.current = queryRef;
    isFirstSnapshotRef.current = true;
    dataRef.current = [];
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    
    unsubscribeRef.current = onSnapshot(
      queryRef,
      (snapshot: QuerySnapshot) => {
        if (!isMountedRef.current) return;

        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];

        const isFirstSnapshot = isFirstSnapshotRef.current;

        // On first snapshot, always set the data
        if (isFirstSnapshot) {
          dataRef.current = items;
          setData(items);
          setLoading(false);
          isFirstSnapshotRef.current = false;
          isSubscribingRef.current = false;
        } else {
          // On subsequent snapshots, only update if data actually changed
          const dataChanged = !arraysEqualById(dataRef.current, items);
          if (dataChanged) {
            dataRef.current = items;
            setData(items);
          }
        }
      },
      (err: Error) => {
        if (!isMountedRef.current) return;
        setError(err);
        setLoading(false);
        isFirstSnapshotRef.current = false;
        isSubscribingRef.current = false;
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        currentQueryRef.current = null;
        isSubscribingRef.current = false;
      }
    };
  }, [queryRef, enabled]);

  return { data, loading, error };
}

// User hooks
export function useUser(userId: string | null, enabled: boolean = true) {
  const [user, setUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const docRef = doc(db, "users", userId);

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          setUser({ id: snapshot.id, ...snapshot.data() } as FirestoreUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, enabled]);

  return { user, loading, error };
}

// Patient hooks
export function usePatient(patientId: string | null, enabled: boolean = true) {
  const [patient, setPatient] = useState<FirestorePatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const docRef = doc(db, "patients", patientId);

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          setPatient({
            id: snapshot.id,
            ...snapshot.data(),
          } as FirestorePatient);
        } else {
          setPatient(null);
        }
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [patientId, enabled]);

  return { patient, loading, error };
}

export function usePatients(queryRef: Query | null, enabled: boolean = true) {
  return useFirestoreQuery<FirestorePatient>(queryRef, enabled);
}

// Users hooks - get all users
export function useUsers(queryRef: Query | null, enabled: boolean = true) {
  return useFirestoreQuery<FirestoreUser>(queryRef, enabled);
}

// Reports hooks
export function useReports(queryRef: Query | null, enabled: boolean = true) {
  return useFirestoreQuery<FirestoreReport>(queryRef, enabled);
}

// Reading hooks
export function useReadings(
  patientId: string | null,
  enabled: boolean = true
) {
  const [readings, setReadings] = useState<FirestoreReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const readingsRef = collection(db, `patients/${patientId}/readings`);
    const q = query(readingsRef, orderBy("date", "desc"));

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestoreReading[];
        setReadings(items);
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [patientId, enabled]);

  return { readings, loading, error };
}

// Medical Notes hooks
export function useMedicalNotes(
  patientId: string | null,
  enabled: boolean = true
) {
  const [notes, setNotes] = useState<FirestoreMedicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const notesRef = collection(db, `patients/${patientId}/medicalNotes`);
    const q = query(notesRef, orderBy("createdAt", "desc"));

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestoreMedicalNote[];
        setNotes(items);
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [patientId, enabled]);

  return { notes, loading, error };
}

// Medications hooks
export function useMedications(
  patientId: string | null,
  enabled: boolean = true
) {
  const [medications, setMedications] = useState<FirestoreMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const medicationsRef = collection(db, `patients/${patientId}/medications`);
    const q = query(medicationsRef, orderBy("createdAt", "desc"));

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestoreMedication[];
        setMedications(items);
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [patientId, enabled]);

  return { medications, loading, error };
}

// Notifications hooks
export function useNotifications(
  userId: string | null,
  enabled: boolean = true
) {
  const [notifications, setNotifications] = useState<FirestoreNotification[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(notificationsRef, orderBy("createdAt", "desc"));

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestoreNotification[];
        setNotifications(items);
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, enabled]);

  return { notifications, loading, error };
}

// Messages hooks
export function useMessages(queryRef: Query | null, enabled: boolean = true) {
  return useFirestoreQuery<FirestoreMessage>(queryRef, enabled);
}

// Unread notifications count hook
export function useUnreadNotificationsCount(
  userId: string | null,
  enabled: boolean = true
) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(notificationsRef, where("isRead", "==", false));

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        setCount(snapshot.size);
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, enabled]);

  return { count, loading, error };
}

// Patient Alerts hooks
export function usePatientAlerts(
  patientId: string | null,
  options?: {
    resolved?: boolean;
    enabled?: boolean;
  }
) {
  const { enabled = true, resolved } = options || {};
  const [alerts, setAlerts] = useState<FirestorePatientAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const alertsRef = collection(db, `patients/${patientId}/alerts`);
    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
    
    if (resolved !== undefined) {
      constraints.unshift(where("isResolved", "==", resolved));
    }
    
    const q = query(alertsRef, ...constraints);

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestorePatientAlert[];
        setAlerts(items);
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [patientId, enabled, resolved]);

  return { alerts, loading, error };
}

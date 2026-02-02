import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  onSnapshot,
  doc,
  query,
  where,
  orderBy,
  limit,
  or,
  type Query,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Unsubscribe,
  type DocumentReference,
  type QueryConstraint,
} from "firebase/firestore";
import {
  usersCollection,
  patientsCollection,
  messagesCollection,
  auditLogsCollection,
  getReadingsCollection,
  getNotificationsCollection,
  getMedicalNotesCollection,
  getMedicationsCollection,
  getScheduledReadingsCollection,
  getPatientAlertsCollection,
} from "@/lib/firestore-helpers";
import type {
  FirestoreUser,
  FirestorePatient,
  FirestoreReading,
  FirestoreMedicalNote,
  FirestoreMedication,
  FirestoreScheduledReading,
  FirestoreNotification,
  FirestoreMessage,
  FirestorePatientAlert,
  FirestoreAuditLog,
} from "@/types/firestore";

/**
 * Generic real-time document listener hook
 * Provides more control over subscription lifecycle than useFirestore hooks
 */
export function useRealtimeDocument<T>(
  docRef: DocumentReference<T> | null,
  options: {
    enabled?: boolean;
    onNext?: (data: T | null) => void;
    onError?: (error: Error) => void;
  } = {},
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  unsubscribe: () => void;
} {
  const { enabled = true, onNext, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const docRefRef = useRef<DocumentReference<T> | null>(null);
  const onNextRef = useRef(onNext);
  const onErrorRef = useRef(onError);

  // Update callback refs when they change
  useEffect(() => {
    onNextRef.current = onNext;
    onErrorRef.current = onError;
  }, [onNext, onError]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!docRef || !enabled) {
      // Clean up if disabled
      if (unsubscribeRef.current) {
        unsubscribe();
      }
      setLoading(false);
      docRefRef.current = null;
      return;
    }

    // Only create new subscription if docRef actually changed
    if (docRefRef.current === docRef && unsubscribeRef.current) {
      // DocRef hasn't changed, keep existing subscription
      return;
    }

    // Clean up previous subscription if docRef changed
    if (unsubscribeRef.current) {
      unsubscribe();
    }

    docRefRef.current = docRef;
    setLoading(true);
    setError(null);

    unsubscribeRef.current = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = { id: snapshot.id, ...snapshot.data() } as T;
          setData(docData);
          onNextRef.current?.(docData);
        } else {
          setData(null);
          onNextRef.current?.(null);
        }
        setLoading(false);
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
        onErrorRef.current?.(error);
      },
    );

    return () => {
      unsubscribe();
      docRefRef.current = null;
    };
  }, [docRef, enabled, unsubscribe]);

  return { data, loading, error, unsubscribe };
}

/**
 * Generic real-time query listener hook
 * Provides more control over subscription lifecycle than useFirestore hooks
 */
export function useRealtimeQuery<T>(
  queryRef: Query<T> | null,
  options: {
    enabled?: boolean;
    onNext?: (data: T[]) => void;
    onError?: (error: Error) => void;
  } = {},
): {
  data: T[];
  loading: boolean;
  error: Error | null;
  unsubscribe: () => void;
} {
  const { enabled = true, onNext, onError } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const queryRefRef = useRef<Query<T> | null>(null);
  const onNextRef = useRef(onNext);
  const onErrorRef = useRef(onError);

  // Update callback refs when they change
  useEffect(() => {
    onNextRef.current = onNext;
    onErrorRef.current = onError;
  }, [onNext, onError]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!queryRef || !enabled) {
      // Clean up if disabled
      if (unsubscribeRef.current) {
        unsubscribe();
      }
      setLoading(false);
      queryRefRef.current = null;
      return;
    }

    // Only create new subscription if query actually changed
    if (queryRefRef.current === queryRef && unsubscribeRef.current) {
      // Query hasn't changed, keep existing subscription
      return;
    }

    // Clean up previous subscription if query changed
    if (unsubscribeRef.current) {
      unsubscribe();
    }

    queryRefRef.current = queryRef;
    setLoading(true);
    setError(null);

    unsubscribeRef.current = onSnapshot(
      queryRef,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(docs);
        onNextRef.current?.(docs);
        setLoading(false);
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
        onErrorRef.current?.(error);
      },
    );

    return () => {
      unsubscribe();
      queryRefRef.current = null;
    };
  }, [queryRef, enabled, unsubscribe]);

  return { data, loading, error, unsubscribe };
}

/**
 * Real-time listener for user document
 */
export function useRealtimeUser(
  userId: string | null,
  options?: {
    enabled?: boolean;
    onNext?: (user: FirestoreUser | null) => void;
    onError?: (error: Error) => void;
  },
) {
  const docRef =
    userId && options?.enabled !== false
      ? (doc(usersCollection, userId) as DocumentReference<FirestoreUser>)
      : null;

  return useRealtimeDocument<FirestoreUser>(docRef, options);
}

/**
 * Real-time listener for patient document
 */
export function useRealtimePatient(
  patientId: string | null,
  options?: {
    enabled?: boolean;
    onNext?: (patient: FirestorePatient | null) => void;
    onError?: (error: Error) => void;
  },
) {
  const docRef =
    patientId && options?.enabled !== false
      ? (doc(
          patientsCollection,
          patientId,
        ) as DocumentReference<FirestorePatient>)
      : null;

  return useRealtimeDocument<FirestorePatient>(docRef, options);
}

/**
 * Real-time listener for patient readings
 */
export function useRealtimeReadings(
  patientId: string | null,
  options?: {
    enabled?: boolean;
    limitCount?: number;
    orderByField?: "date" | "createdAt";
    orderDirection?: "asc" | "desc";
    onNext?: (readings: FirestoreReading[]) => void;
    onError?: (error: Error) => void;
  },
) {
  const queryRef = useMemo(() => {
    if (!patientId || options?.enabled === false) {
      return null;
    }
    const collection = getReadingsCollection(patientId);
    const constraints = [];
    if (options?.orderByField === "date" || !options?.orderByField) {
      constraints.push(orderBy("date", options?.orderDirection || "desc"));
    } else {
      constraints.push(orderBy("createdAt", options?.orderDirection || "desc"));
    }
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    return query(collection, ...constraints) as Query<FirestoreReading>;
  }, [
    patientId,
    options?.enabled,
    options?.orderByField,
    options?.orderDirection,
    options?.limitCount,
  ]);

  return useRealtimeQuery<FirestoreReading>(queryRef, options);
}

/**
 * Real-time listener for user notifications
 */
export function useRealtimeNotifications(
  userId: string | null,
  options?: {
    enabled?: boolean;
    unreadOnly?: boolean;
    limitCount?: number;
    onNext?: (notifications: FirestoreNotification[]) => void;
    onError?: (error: Error) => void;
  },
) {
  const enabled = options?.enabled !== false && !!userId;
  const queryRef = useMemo(() => {
    if (!userId || !enabled) return null;
    const collection = getNotificationsCollection(userId);
    const constraints: any[] = [];
    if (options?.unreadOnly) {
      constraints.push(where("isRead", "==", false));
    }
    constraints.push(orderBy("createdAt", "desc"));
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    return query(collection, ...constraints) as Query<FirestoreNotification>;
  }, [userId, enabled, options?.unreadOnly, options?.limitCount]);

  return useRealtimeQuery<FirestoreNotification>(queryRef, options);
}

/**
 * Real-time listener for messages (sent or received)
 */
export function useRealtimeMessages(
  userId: string | null,
  options?: {
    enabled?: boolean;
    type?: "sent" | "received" | "all";
    unreadOnly?: boolean;
    limitCount?: number;
    onNext?: (messages: FirestoreMessage[]) => void;
    onError?: (error: Error) => void;
  },
) {
  const queryRef =
    userId && options?.enabled !== false
      ? (() => {
          const constraints = [];
          if (options?.type === "sent") {
            constraints.push(where("senderId", "==", userId));
          } else if (options?.type === "received") {
            constraints.push(where("recipientId", "==", userId));
          } else {
            // All messages for this user
            constraints.push(
              or(
                where("senderId", "==", userId),
                where("recipientId", "==", userId),
              ),
            );
          }
          if (options?.unreadOnly) {
            constraints.push(where("isRead", "==", false));
          }
          constraints.push(orderBy("createdAt", "desc"));
          if (options?.limitCount) {
            constraints.push(limit(options.limitCount));
          }
          return query(
            messagesCollection,
            ...(constraints as QueryConstraint[]),
          ) as Query<FirestoreMessage>;
        })()
      : null;

  return useRealtimeQuery<FirestoreMessage>(queryRef, options);
}

/**
 * Real-time listener for patient medical notes
 */
export function useRealtimeMedicalNotes(
  patientId: string | null,
  options?: {
    enabled?: boolean;
    limitCount?: number;
    onNext?: (notes: FirestoreMedicalNote[]) => void;
    onError?: (error: Error) => void;
  },
) {
  const queryRef = useMemo(() => {
    if (!patientId || options?.enabled === false) {
      return null;
    }
    const collection = getMedicalNotesCollection(patientId);
    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    return query(collection, ...constraints) as Query<FirestoreMedicalNote>;
  }, [patientId, options?.enabled, options?.limitCount]);

  return useRealtimeQuery<FirestoreMedicalNote>(queryRef, options);
}

/**
 * Real-time listener for patient medications
 */
export function useRealtimeMedications(
  patientId: string | null,
  options?: {
    enabled?: boolean;
    activeOnly?: boolean;
    limitCount?: number;
    onNext?: (medications: FirestoreMedication[]) => void;
    onError?: (error: Error) => void;
  },
) {
  const queryRef = useMemo(() => {
    if (!patientId || options?.enabled === false) {
      return null;
    }
    const collection = getMedicationsCollection(patientId);
    const constraints = [];
    if (options?.activeOnly) {
      constraints.push(where("isActive", "==", true));
    }
    constraints.push(orderBy("createdAt", "desc"));
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    return query(collection, ...constraints) as Query<FirestoreMedication>;
  }, [patientId, options?.enabled, options?.activeOnly, options?.limitCount]);

  return useRealtimeQuery<FirestoreMedication>(queryRef, options);
}

/**
 * Real-time listener for scheduled readings
 */
export function useRealtimeScheduledReadings(
  patientId: string | null,
  options?: {
    enabled?: boolean;
    status?: "pending" | "completed" | "missed" | "cancelled";
    limitCount?: number;
    onNext?: (scheduled: FirestoreScheduledReading[]) => void;
    onError?: (error: Error) => void;
  },
) {
  const queryRef =
    patientId && options?.enabled !== false
      ? (() => {
          const collection = getScheduledReadingsCollection(patientId);
          const constraints = [];
          if (options?.status) {
            constraints.push(where("status", "==", options.status));
          }
          constraints.push(orderBy("scheduledDate", "asc"));
          if (options?.limitCount) {
            constraints.push(limit(options.limitCount));
          }
          return query(
            collection,
            ...constraints,
          ) as Query<FirestoreScheduledReading>;
        })()
      : null;

  return useRealtimeQuery<FirestoreScheduledReading>(queryRef, options);
}

/**
 * Real-time listener for patient alerts
 */
export function useRealtimePatientAlerts(
  patientId: string | null,
  options?: {
    enabled?: boolean;
    resolved?: boolean;
    limitCount?: number;
    onNext?: (alerts: FirestorePatientAlert[]) => void;
    onError?: (error: Error) => void;
  },
) {
  const queryRef = useMemo(() => {
    if (!patientId || options?.enabled === false) {
      return null;
    }
    const collection = getPatientAlertsCollection(patientId);
    const constraints = [];
    if (options?.resolved !== undefined) {
      constraints.push(where("isResolved", "==", options.resolved));
    }
    constraints.push(orderBy("createdAt", "desc"));
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    return query(collection, ...constraints) as Query<FirestorePatientAlert>;
  }, [patientId, options?.enabled, options?.resolved, options?.limitCount]);

  return useRealtimeQuery<FirestorePatientAlert>(queryRef, options);
}

/**
 * Real-time listener for audit logs
 */
export function useRealtimeAuditLogs(
  queryRef: Query<FirestoreAuditLog> | null,
  options?: {
    enabled?: boolean;
    onNext?: (logs: FirestoreAuditLog[]) => void;
    onError?: (error: Error) => void;
  },
) {
  return useRealtimeQuery<FirestoreAuditLog>(queryRef, options);
}

/**
 * Hook to manually control real-time subscriptions
 * Useful for complex scenarios where you need fine-grained control
 */
export function useRealtimeSubscription() {
  const subscriptionsRef = useRef<Map<string, Unsubscribe>>(new Map());

  const subscribe = useCallback(
    <T>(
      key: string,
      queryOrDoc: Query<T> | DocumentReference<T>,
      onNext: (data: T | T[] | null) => void,
      onError?: (error: Error) => void,
    ) => {
      // Unsubscribe existing if any
      unsubscribe(key);

      const unsubscribeFn = onSnapshot(
        queryOrDoc as any,
        (
          snapshot:
            | { exists: () => boolean; id: string; data: () => unknown }
            | { docs: { id: string; data: () => unknown }[] },
        ) => {
          if ("exists" in snapshot && typeof snapshot.exists === "function") {
            const snap = snapshot as {
              exists: () => boolean;
              id: string;
              data: () => unknown;
            };
            const data = snap.exists()
              ? ({
                  id: snap.id,
                  ...(typeof snap.data() === "object" && snap.data() !== null
                    ? (snap.data() as object)
                    : {}),
                } as T)
              : null;
            onNext(data);
          } else {
            const snap = snapshot as {
              docs: { id: string; data: () => unknown }[];
            };
            const data = snap.docs.map(
              (d: { id: string; data: () => unknown }) => {
                const raw = d.data();
                return {
                  id: d.id,
                  ...(typeof raw === "object" && raw !== null
                    ? (raw as object)
                    : {}),
                };
              },
            ) as T[];
            onNext(data);
          }
        },
        (err: unknown) => {
          const error = err instanceof Error ? err : new Error(String(err));
          onError?.(error);
        },
      );

      subscriptionsRef.current.set(key, unsubscribeFn);
      return unsubscribeFn;
    },
    [],
  );

  const unsubscribe = useCallback((key: string) => {
    const unsubscribeFn = subscriptionsRef.current.get(key);
    if (unsubscribeFn) {
      unsubscribeFn();
      subscriptionsRef.current.delete(key);
    }
  }, []);

  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach((unsubscribeFn) => {
      unsubscribeFn();
    });
    subscriptionsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return {
    subscribe,
    unsubscribe,
    unsubscribeAll,
  };
}

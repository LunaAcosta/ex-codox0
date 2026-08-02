import { collection, onSnapshot, query, QueryConstraint } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { firebase } from '../../core/config/firebase'

const useFetchData = <T>(
    collectionName: string,
    constraints: QueryConstraint[] = []
) => {

    const [data, setData] = useState<T[]>([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null)

    useEffect(()=>{
        if(!collectionName) return;

        const collectionRef = collection(firebase, collectionName);
        const q = query(collectionRef, ...constraints);

        const unsub = onSnapshot(q,(snapshot)=>{
            const fetchedData = snapshot.docs.map(doc=>{
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }) as T[];
            setData(fetchedData);
            setLoading(false);

        },(err)=>{
            setError('No fue posible cargar la información. Intenta de nuevo.');
            setLoading(false)
        });

        return ()=> unsub();
    }, [collectionName, constraints])
  return {
    data,
    loading,
    error
  }
}

export default useFetchData

import { useCallback, useEffect, useState } from "react";

import { getFinancialData } from "../../application/financeApiService";
import { FinancialData } from "../../types/FinanceApiTypes";

const EMPTY_DATA: FinancialData = { wallets: [], transactions: [], reminders: [] };

export const useFinancialData = (uid: string) => {
  const [data, setData] = useState<FinancialData>(EMPTY_DATA);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getFinancialData(uid, true));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar tus datos.");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    void getFinancialData(uid)
      .then((financialData) => { if (active) setData(financialData); })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar tus datos.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid]);

  return { ...data, loading, error, refresh };
};

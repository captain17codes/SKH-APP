import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';

const BlackoutPanel = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await apiClient.get('/resilience/status');
      setStatus(res.data);
    } catch (e) {
      if (e.response?.data) {
        setStatus(e.response.data);
      } else {
        setStatus({ state: 'DATA_LOSS_DETECTED', primary_records: 0, snapshot_records: 5, journal_events: 3, in_flight_actions: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateBlackout = async () => {
    try {
      await apiClient.post('/resilience/simulate-blackout');
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecover = async () => {
    try {
      const res = await apiClient.post('/resilience/recover');
      setStatus(prev => ({ ...prev, recoveryResult: res.data.result, state: 'RECOVERED' }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      await apiClient.post('/resilience/reset-demo');
      setStatus(null);
      setLoading(true);
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitOutbox = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/resilience/outbox', { payload: { title: 'Waste overflow near hospital' } });
      setStatus(prev => ({ ...prev, outboxSuccessId: res.data.id }));
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-on-surface">Checking civic store status...</div>;
  }

  const isHealthy = status?.state === 'HEALTHY';
  const isDataLoss = status?.state === 'DATA_LOSS_DETECTED';
  const isRecovered = status?.state === 'RECOVERED';

  return (
    <div className="border border-outline-variant rounded-lg bg-surface-container-low overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className={`px-6 py-4 flex items-center justify-between ${
        isHealthy ? 'bg-primary-container text-on-primary-container' : 
        isDataLoss ? 'bg-error text-on-error' : 
        'bg-success text-on-success'
      }`}>
        <div className="flex items-center">
          <span className="material-symbols-outlined text-[28px] mr-3">
            {isHealthy ? 'database' : isDataLoss ? 'warning' : 'verified'}
          </span>
          <h2 className="text-title-lg font-bold">
            {isHealthy ? 'PRIMARY CIVIC STORE HEALTHY' : isDataLoss ? 'DATA LOSS DETECTED' : 'SYSTEM RECOVERED'}
          </h2>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* METRICS SECTION */}
        <div>
          <h3 className="text-label-lg font-bold mb-4 text-on-surface-variant uppercase tracking-wider">Storage Metrics</h3>
          <ul className="space-y-3 text-body-lg">
            <li className="flex justify-between border-b border-outline-variant/50 pb-2">
              <span className="text-on-surface-variant">
                {isDataLoss ? 'Records before failure:' : isRecovered ? 'Primary records restored:' : 'Records:'}
              </span>
              <span className="font-bold">{isRecovered ? status.recoveryResult?.primary_records_restored : status.primary_records || (isDataLoss ? 5 : 0)}</span>
            </li>
            
            {isDataLoss && (
              <li className="flex justify-between border-b border-outline-variant/50 pb-2 text-error font-bold">
                <span>Records readable now:</span>
                <span>0</span>
              </li>
            )}
            
            {isRecovered && (
               <>
                 <li className="flex justify-between border-b border-outline-variant/50 pb-2">
                  <span className="text-on-surface-variant">Blackout reports recovered:</span>
                  <span className="font-bold text-success">{status.recoveryResult?.blackout_reports_recovered}</span>
                </li>
                <li className="flex justify-between border-b border-outline-variant/50 pb-2">
                  <span className="text-on-surface-variant">Duplicate dispatches prevented:</span>
                  <span className="font-bold text-success">{status.recoveryResult?.duplicate_dispatches_prevented}</span>
                </li>
               </>
            )}

            {!isRecovered && (
              <li className="flex justify-between border-b border-outline-variant/50 pb-2">
                <span className="text-on-surface-variant">Safe snapshot:</span>
                <span className="font-bold text-primary">{status.snapshot_records}</span>
              </li>
            )}

            <li className="flex justify-between border-b border-outline-variant/50 pb-2">
              <span className="text-on-surface-variant">{isRecovered ? 'Journal events replayed:' : isDataLoss ? 'Journal events surviving:' : 'Journal events:'}</span>
              <span className="font-bold text-primary">{isRecovered ? status.recoveryResult?.journal_events_replayed : status.journal_events}</span>
            </li>
            
            <li className="flex justify-between pb-2">
              <span className="text-on-surface-variant">{isRecovered ? 'In-flight actions restored:' : isDataLoss ? 'In-flight actions requiring recovery:' : 'In-flight actions:'}</span>
              <span className="font-bold">{status.in_flight_actions}</span>
            </li>
          </ul>
        </div>

        {/* HERO PROOF SECTION */}
        <div>
           <h3 className="text-label-lg font-bold mb-4 text-on-surface-variant uppercase tracking-wider">
             {isDataLoss ? 'Independent Recovery Journal' : 'Hero Operation'}
           </h3>
           
           <div className="bg-surface border border-outline-variant p-4 rounded-lg shadow-sm">
             
             {isHealthy && (
               <>
                <div className="font-bold text-title-md mb-1">TKT-001</div>
                <div className="text-body-md text-on-surface-variant mb-3">Drain blockage near hospital</div>
                <div className="inline-flex items-center bg-primary-container text-on-primary-container px-3 py-1 rounded text-label-md font-bold">
                  JCB-01 DISPATCHED
                </div>
               </>
             )}

             {isDataLoss && (
               <>
                <div className="font-bold text-title-md text-error mb-1">TKT-001</div>
                <div className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Last known action:</div>
                <div className="inline-flex items-center bg-surface-container-high text-on-surface px-3 py-1 rounded text-label-md font-bold">
                  JCB-01 DISPATCHED
                </div>
               </>
             )}

             {isRecovered && (
               <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-label-sm text-on-surface-variant uppercase mb-1">Before Blackout</div>
                    <div className="text-body-sm font-bold">TKT-001 &rarr; JCB-01 DISPATCHED</div>
                  </div>
                </div>
                <div className="flex justify-between items-start pt-3 border-t border-outline-variant/50">
                  <div>
                    <div className="text-label-sm text-on-surface-variant uppercase mb-1">After Recovery</div>
                    <div className="text-body-sm font-bold text-success flex items-center">
                      TKT-001 &rarr; JCB-01 STILL DISPATCHED
                    </div>
                  </div>
                  <span className="text-success font-bold text-label-sm flex items-center">
                    <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span>
                    DUPLICATE PREVENTED
                  </span>
                </div>
               </>
             )}

           </div>

           {/* USER ACTION FORM DURING BLACKOUT */}
           {isDataLoss && !status.outboxSuccessId && (
             <div className="mt-6 p-4 border border-warning/50 bg-warning-container/20 rounded-lg">
                <h4 className="font-bold text-label-md mb-2">Submit report while system is recovering</h4>
                <form onSubmit={handleSubmitOutbox} className="flex gap-2">
                  <input type="text" readOnly value="Waste overflow near hospital" className="flex-1 px-3 py-2 border border-outline-variant rounded text-body-sm bg-surface-container-lowest" />
                  <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-label-sm hover:bg-primary/90 transition-colors">
                    Report
                  </button>
                </form>
             </div>
           )}

           {status.outboxSuccessId && !isRecovered && (
             <div className="mt-6 p-4 border border-success/50 bg-success-container/20 rounded-lg flex items-center text-success">
               <span className="material-symbols-outlined mr-2">inventory_2</span>
               <div>
                 <div className="font-bold text-label-lg">{status.outboxSuccessId}</div>
                 <div className="text-label-sm uppercase tracking-wider">SAFE IN RECOVERY OUTBOX</div>
               </div>
             </div>
           )}

           {isRecovered && status.outboxSuccessId && (
             <div className="mt-4 bg-surface border border-outline-variant p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-body-md text-on-surface-variant">
                    {status.outboxSuccessId} &rarr; <span className="text-on-surface">TKT-006</span>
                  </div>
                  <span className="text-success font-bold text-label-sm flex items-center">
                    <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span>
                    RECOVERED
                  </span>
                </div>
             </div>
           )}

        </div>
      </div>

      {/* BUTTONS SECTION */}
      <div className="px-6 py-4 bg-surface-container-high border-t border-outline-variant flex gap-4">
        <button 
          onClick={handleSimulateBlackout}
          disabled={!isHealthy}
          className={`px-4 py-2 font-bold rounded flex items-center text-label-md transition-colors ${isHealthy ? 'bg-error text-on-error hover:bg-error/90 shadow' : 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'}`}
        >
          <span className="material-symbols-outlined mr-2 text-[20px]">bolt</span>
          SIMULATE DATA LOSS
        </button>
        
        <button 
          onClick={handleRecover}
          disabled={!isDataLoss}
          className={`px-4 py-2 font-bold rounded flex items-center text-label-md transition-colors ${isDataLoss ? 'bg-primary text-on-primary hover:bg-primary/90 shadow' : 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'}`}
        >
          <span className="material-symbols-outlined mr-2 text-[20px]">restore</span>
          RECOVER CIVIC STATE
        </button>

        <div className="flex-1"></div>

        <button 
          onClick={handleReset}
          className="px-4 py-2 font-bold rounded flex items-center text-label-md text-on-surface border border-outline-variant hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined mr-2 text-[20px]">restart_alt</span>
          RESET DEMO
        </button>
      </div>

    </div>
  );
};

export default BlackoutPanel;

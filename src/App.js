import React, { useState } from 'react';
import { ethers } from 'ethers';

const RPC = 'https://rpc.berachain.com';
const CONTRACT_ADDRESS = '0xEe6f49Dc2f1D0d9567dDd3FD6D77D8F7edfe7379';

function App() {
  const [loading, setLoading] = useState(false);
  const [beraReceived, setBeraReceived] = useState(null);
  const [startBlock, setStartBlock] = useState(null);
  const [endBlock, setEndBlock] = useState(null);

  const provider = new ethers.JsonRpcProvider(RPC);

  const getStartOfDayUTC = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  };

  const findBlockByTimestamp = async (targetTime) => {
    let latest = await provider.getBlockNumber();
    let low = 0;
    let high = latest;
    let bestMatch = latest;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const block = await provider.getBlock(mid);
      if (!block) break;
      const ts = block.timestamp * 1000;
      if (ts < targetTime.getTime()) {
        low = mid + 1;
      } else {
        bestMatch = mid;
        high = mid - 1;
      }
    }

    return bestMatch;
  };

  const scanTransactions = async () => {
    setLoading(true);
    setBeraReceived(null);

    const startUTC = getStartOfDayUTC();
    const start = await findBlockByTimestamp(startUTC);
    const end = await provider.getBlockNumber();

    setStartBlock(start);
    setEndBlock(end);

    let total = ethers.BigNumber.from(0);

    for (let i = start; i <= end; i++) {
      const block = await provider.getBlock(i, true);
      if (!block || !block.transactions) continue;

      for (const tx of block.transactions) {
        if (tx.to && tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
          total = total.add(tx.value);
        }
      }
    }

    const totalEth = parseFloat(ethers.formatEther(total));
    setBeraReceived(totalEth.toFixed(6));
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', textAlign: 'center' }}>
      <h1>🧠 BERA Yeeted Today</h1>
      <p>Contract: <code>{CONTRACT_ADDRESS}</code></p>
      <button onClick={scanTransactions} disabled={loading} style={{ padding: '10px 25px', fontSize: '16px' }}>
        {loading ? 'Scanning...' : '🔁 Scan from 00:00 UTC'}
      </button>

      {beraReceived && (
        <div style={{ marginTop: '30px' }}>
          <h2>💰 {beraReceived} BERA</h2>
          <p>(From block <strong>{startBlock}</strong> to <strong>{endBlock}</strong>)</p>
        </div>
      )}
    </div>
  );
}

export default App;

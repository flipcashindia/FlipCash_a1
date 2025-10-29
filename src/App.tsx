import { useState } from 'react';

function App() {
  const [balance, setBalance] = useState(1000);
  const [amount, setAmount] = useState('');

  const handleDeposit = () => {
    const value = parseFloat(amount);
    if (value && value > 0) {
      setBalance(balance + value);
      setAmount('');
    }
  };

  const handleWithdraw = () => {
    const value = parseFloat(amount);
    if (value && value > 0 && value <= balance) {
      setBalance(balance - value);
      setAmount('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            💰 FlipCash
          </h1>
          <p className="text-gray-500">Your Digital Wallet</p>
        </div>

        {/* Balance Display */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 mb-6 text-white">
          <p className="text-sm opacity-90 mb-1">Current Balance</p>
          <p className="text-4xl font-bold">
            ${balance.toFixed(2)}
          </p>
        </div>

        {/* Input Field */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleDeposit}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 active:scale-95"
          >
            Deposit
          </button>
          <button
            onClick={handleWithdraw}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 active:scale-95"
          >
            Withdraw
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setAmount('10')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition"
            >
              $10
            </button>
            <button
              onClick={() => setAmount('50')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition"
            >
              $50
            </button>
            <button
              onClick={() => setAmount('100')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition"
            >
              $100
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
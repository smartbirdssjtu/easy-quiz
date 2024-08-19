"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface UserEntry {
  key: string;
  selectedValue: string;
  correctValue: string;
  isCorrect: boolean;
}

const Home: React.FC = () => {
  const [data, setData] = useState<string[][]>([]);
  const [uniqueValues, setUniqueValues] = useState<string[]>([]);
  const [randomKey, setRandomKey] = useState<string | null>(null);
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [userEntries, setUserEntries] = useState<UserEntry[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [limit, setLimit] = useState<number>(3); // New state for limit
  const [entryLimit, setEntryLimit] = useState<number>(10);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
      // Reset quiz state
      setData(jsonData);
      setUniqueValues([]);
      setRandomKey(null);
      setAvailableKeys([]);
      setUserEntries([]);
      setAnsweredQuestions(0);
      setTotalQuestions(0);
      setShowSummary(false);
  
      // Initialize new quiz with all rows considered as data
      const secondColumnValues = jsonData.map(row => row[1]); // Include all rows
      const uniqueSet = new Set(secondColumnValues);
      const limitedUniqueValues = Array.from(uniqueSet).slice(0, limit); // Apply the limit
      setUniqueValues(limitedUniqueValues);
  
      // Filter keys based on limited unique values
      const filteredKeys = jsonData
        .filter(row => limitedUniqueValues.includes(row[1]))
        .map(row => row[0])
        .slice(0, entryLimit);

      setTotalQuestions(filteredKeys.length);
      setAvailableKeys(filteredKeys);
  
      // Select a random key from the filtered keys
      if (filteredKeys.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredKeys.length);
        setRandomKey(filteredKeys[randomIndex]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setLimit(value);
    }
  };

  const handleEntryLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setEntryLimit(value);
    }
  };

  const handleSubmit = () => {
    if (randomKey && availableKeys.length > 0) {
      const selectedValue = (document.getElementById('dropdown') as HTMLSelectElement).value;
      const correctValue = data.find(row => row[0] === randomKey)?.[1] || '';
      const isCorrect = selectedValue === correctValue;

      // Save the user's entry
      setUserEntries(prevEntries => [
        ...prevEntries,
        { key: randomKey, selectedValue, correctValue, isCorrect }
      ]);

      // Remove the selected key from available keys
      const remainingKeys = availableKeys.filter(key => key !== randomKey);
      setAvailableKeys(remainingKeys);

      // Increment the answered questions count
      setAnsweredQuestions(prev => prev + 1);

      // Check if all questions have been answered
      if (remainingKeys.length === 0) {
        setRandomKey(null);
        setShowSummary(true);
      } else {
        // Select a new random key
        const randomIndex = Math.floor(Math.random() * remainingKeys.length);
        setRandomKey(remainingKeys[randomIndex]);
      }
    }
  };

  const displaySummary = () => {
    const correctCount = userEntries.filter(entry => entry.isCorrect).length;
    const incorrectEntries = userEntries.filter(entry => !entry.isCorrect);
    const correctEntries = userEntries.filter(entry => entry.isCorrect);

    const percentageCorrect = (correctCount / userEntries.length) * 100;

    return (
      <div>
        <h2>Summary</h2>
        <p>Correct Answers: {correctCount}</p>
        <p>Incorrect Answers: {userEntries.length - correctCount}</p>
        <p>Percentage Correct: {percentageCorrect.toFixed(2)}%</p>
        <h3>Incorrect Entries:</h3>
        <table style={{ margin: '0 auto', borderCollapse: 'collapse', width: '80%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Entry</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Your Answer</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            {incorrectEntries.map((e, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{e.key}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{e.selectedValue}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: 'red' }}>{e.correctValue}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Correct Entries:</h3>
      <table style={{ margin: '0 auto', borderCollapse: 'collapse', width: '80%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Entry</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Correct Answer</th>
          </tr>
        </thead>
        <tbody>
          {correctEntries.map((e, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{e.key}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{e.correctValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    );
  };

  const handleEnd = () => {
    if (!showSummary) {
      setShowSummary(true);
    }
  };

  const progress = (answeredQuestions / totalQuestions) * 100;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ marginTop: '20px' }}>
        <label>
          Set Limit of Categories: 
          <input 
            type="number" 
            value={limit} 
            onChange={handleLimitChange} 
            style={{ marginLeft: '10px', fontSize: '16px', padding: '4px' }} 
            min="1"
          />
        </label>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>
          Set Limit of Questions: 
          <input 
            type="number" 
            value={entryLimit} 
            onChange={handleEntryLimitChange} 
            style={{ marginLeft: '10px', fontSize: '16px', padding: '4px' }}
            className="border border-gray-300 rounded-lg shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            min="1"
          />
        </label>
      </div>

      <h1>Upload an Excel File</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

      {totalQuestions > 0 && !showSummary && (
        <>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <div style={{ width: '300px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  height: '20px',
                  width: `${progress}%`,
                  backgroundColor: '#76c7c0',
                  textAlign: 'center',
                  color: 'white',
                  lineHeight: '20px'
                }}>
                  {`${Math.round(progress)}%`}
                </div>
              </div>
              <button onClick={handleEnd} style={{ marginLeft: '20px' }}>End</button>
            </div>
          </div>
          {randomKey && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px' }}>
              <strong>{randomKey}</strong>
              <select
  id="dropdown"
  size={uniqueValues.length} // This will make all options visible in a box
  style={{
    fontSize: '16px',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    outline: 'none',
    width: 'auto', // Change 'auto' to a specific value if needed
    maxWidth: '300px', // You can adjust this to limit the width
    overflowY: 'auto', // Adds a scroll if there are too many items
    whiteSpace: 'nowrap', // Prevents text wrapping to keep the width smaller
  }}
>
  {uniqueValues.map((value, index) => (
    <option key={index} value={value}>
      {value}
    </option>
  ))}
</select>
              <button
  onClick={handleSubmit}
  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
>
  Submit
</button>
            </div>
          )}
        </>
      )}
      {showSummary && displaySummary()}
    </div>
  );
};

export default Home;

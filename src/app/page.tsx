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

  useEffect(() => {
    if (data.length > 0) {
      const keys = data.map(row => row[0]); // Include the first row as valid data
      setTotalQuestions(keys.length);
      setAvailableKeys(keys);
      if (keys.length > 0) {
        const randomIndex = Math.floor(Math.random() * keys.length);
        setRandomKey(keys[randomIndex]);
      }
    }
  }, [data]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Parse the sheet without excluding the header row
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
      setUniqueValues(Array.from(uniqueSet));
  
      const keys = jsonData.map(row => row[0]); // Include all rows
      setTotalQuestions(keys.length);
      setAvailableKeys(keys);
      if (keys.length > 0) {
        const randomIndex = Math.floor(Math.random() * keys.length);
        setRandomKey(keys[randomIndex]);
      }
    };
    reader.readAsArrayBuffer(file);
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
              <select id="dropdown">
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

import React from 'react';
import FHIREditor from './FHIREditor';  // Import the FHIREditor component

// Render the FHIREditor component
function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>FHIR Editor Application</h1>
            </header>
            <main>
                <FHIREditor />
            </main>
        </div>
    );
}

export default App;

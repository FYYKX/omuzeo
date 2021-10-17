import React, {useEffect} from 'react';
import "./config"
import Authenticate from "./Authenticate";

const App = () => {
    return <>
        <div className="App">Omuseo home</div>
        <Authenticate />
    </>
}

export default App;

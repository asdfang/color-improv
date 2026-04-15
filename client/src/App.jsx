import { TopPanel } from './components/controls/TopPanel';
import { Grid } from './components/grid/Grid';

export default function App() {
    return (
        <>
            <div id="app">
                <TopPanel />
                <Grid />
            </div>
            <div id="rotate-prompt">
                <p>Please rotate your device to landscape mode to play!</p>
                <p>(You may need to turn off portrait lock)</p>
            </div>
        </>
    );
}
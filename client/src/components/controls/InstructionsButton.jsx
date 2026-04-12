export function InstructionsButton() {
    const handleClick = () => {
        console.log("todo: open instructions dialog");
    }

    return (
        <div id="instructions-button" onClick={handleClick}>
            <span>Click for instructions and help.</span>
        </div>
    );
}
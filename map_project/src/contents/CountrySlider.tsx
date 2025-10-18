import '../style/CountrySlider.css'

interface SliderProps{
    value: number,
    setValue: (newValue: number) => void;
    label: string,
}

function CountrySlider({
    value,
    setValue,
    label,
}: SliderProps){

    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = parseFloat(event.target.value).toFixed(1)
        setValue(parseFloat(newValue))
    }

    return (
        <>
            <div className="slider-container">
                <label htmlFor="styledSlider" className="slider-label">
                    {label === "size" ? `${label}:` : `${label} cost:`}
                </label>
                <div className="slid">
                    <input
                        type="range"
                        id="styledSlider"
                        className="styled-slider"
                        min={label !== "size" ? 1 : 100}
                        max={label !== "size" ? 10 : 10000}
                        step={label === "size" ? 1 : 0.1}
                        value={value}
                        onChange={handleSliderChange}
                    />
                    <label htmlFor="styledSlider" id='value_number'>{value}</label>
                </div>
            </div>
        </>
    )
}

export default CountrySlider;
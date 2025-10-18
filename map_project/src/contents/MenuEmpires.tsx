import { useEffect, useState } from "react";
import CountrySlider from "./CountrySlider";

import { useMenuSettings } from "./SettingContext";

function MenuEmpires(){
    const { 
        draftEmpires,
        activeEmpireId,    
        updateDraftSetting, 
        updateEmpireName,
        updateEmpireColor,
        setActiveEmpireId, 
        addEmpire,
        deleteEmpire,
        commitSettings,   
    } = useMenuSettings();

    const activeEmpire = draftEmpires.find(empire => empire.id === activeEmpireId)

    const [ expandList, setExpandList ] = useState<boolean>(false)
    const [ empireNameInput, setEmpireNameInput ] = useState<string>('')

    useEffect(() => {
        setEmpireNameInput(activeEmpire ? activeEmpire.name : '')
    }, [activeEmpire])

    //// for automatization of CountrySlider
    // const sliderKeys: (keyof CountrySliderValues)[] = activeEmpire ? Object.keys(activeEmpire.settings) as (keyof CountrySliderValues)[] : [];

    return(
        <>
            <div className="empire_container">
                <div className="empire_header">
                    {"Terrain & empires settings"}
                </div>
                <div 
                    className="empire_list"
                    onClick={() => {
                        setExpandList(!expandList)
                    }}
                    style={expandList ? {height: 'auto'} : {height: "15vh"}}
                >
                     {draftEmpires.map(empire => (
                        <div
                            className="empire_box"
                            key={empire.id}
                            style={(empire.id === activeEmpireId) ? {backgroundColor: 'green'} : {backgroundColor: '#051d3485'}}
                            onClick={(e) => {
                                setActiveEmpireId(empire.id)
                                commitSettings()
                                e.stopPropagation()
                            }}
                            >
                            <span>{`${empire.name}`}</span>
                        </div>
                     ))}
                </div>
                <div className="empire_settings">
                    { activeEmpire && (
                    <>
                    <div className="empire_name">{`${activeEmpire.name} settings:`}</div>
                    <div className="empire_sliders">
                        <CountrySlider 
                            value={activeEmpire.settings.water}
                            setValue={(newValue: number) => {updateDraftSetting(activeEmpireId, "water", newValue)}}
                            label={"water"}
                        />
                        <CountrySlider 
                            value={activeEmpire.settings.river}
                            setValue={(newValue: number) => {updateDraftSetting(activeEmpireId, "river", newValue)}}
                            label={"river"}
                        />
                        <CountrySlider 
                            value={activeEmpire.settings.plain}
                            setValue={(newValue: number) => {updateDraftSetting(activeEmpireId, "plain", newValue)}}
                            label={"plain"}
                        />
                        <CountrySlider 
                            value={activeEmpire.settings.forest}
                            setValue={(newValue: number) => {updateDraftSetting(activeEmpireId, "forest", newValue)}}
                            label={"forest"}
                        />
                        <CountrySlider 
                            value={activeEmpire.settings.mountain}
                            setValue={(newValue: number) => {updateDraftSetting(activeEmpireId, "mountain", newValue)}}
                            label={"mountain"}
                        />
                        <CountrySlider 
                            value={activeEmpire.settings.desert}
                            setValue={(newValue: number) => {updateDraftSetting(activeEmpireId, "desert", newValue)}}
                            label={"desert"}
                        />
                        <CountrySlider 
                            value={activeEmpire.settings.ice}
                            setValue={(newValue: number) => {updateDraftSetting(activeEmpireId, "ice", newValue)}}
                            label={"ice"}
                        />
                        <CountrySlider 
                            value={activeEmpire.settings.size}
                            setValue={(newValue: number) => {updateDraftSetting(activeEmpireId, "size", newValue)}}
                            label={"size"}
                        />
                    </div>
                    <div className="empire_details">
                        <input 
                            type="text"
                            id="name_input"
                            value={empireNameInput}
                            onChange={(e) => {
                                setEmpireNameInput(e.target.value)
                            }}
                            onBlur={(e) => {
                                updateEmpireName(activeEmpireId, empireNameInput)
                            }} 
                        />
                        <input 
                            type="color" 
                            name="color_input" 
                            id="color_input" 
                            value={activeEmpire.color}
                            onChange={(e) =>{
                                updateEmpireColor(activeEmpireId, e.target.value)
                            }}
                        />
                    </div>
                    
                    </>
                    )}
                </div>
            </div>
            <div className="buttons_section">
                <button
                    className="add_button"
                    onClick={addEmpire}
                >
                    {"Add empire"}
                </button>
                <button
                    className="delete_button"
                    onClick={() => {
                        deleteEmpire(activeEmpireId)
                    }}
                >
                    {"Delete empire"}
                </button>
            </div>
        </>
    )
}

export default MenuEmpires;
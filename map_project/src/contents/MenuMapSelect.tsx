import React from "react";
import { useMenuMapSettings } from "./SettingContext";


function MenuMapSelect(){

    const {
        activeMap,
        setActiveMap,
    } = useMenuMapSettings();

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setActiveMap(event.target.value)
    }

    return (
        <>
            <div className="world_container">
                <div className="world_header">
                    {"Map changer"}
                </div>
                <div className="select_map">
                    <label htmlFor="input_map">{"Select map: "}</label>
                    <select 
                        id='input_map'
                        value={activeMap}
                        onChange={handleSelectChange}
                        >
                        <option value="world">World</option>
                        <option value="europe">Europe</option>
                        <option value="east_asia">Asia</option>
                        <option value="africa">Africa</option>
                        <option value="west_mediteranean">West Mediteranean</option>
                        <option value="middle_east">Middle East</option>
                        <option value="south_america">South America</option>
                        <option value="scandinavia">Scandinavia</option>
                    </select>
                </div>
            </div>
        </>
    )
}

export default MenuMapSelect;
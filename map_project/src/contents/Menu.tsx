
import '../style/Menu.css'

import MenuEmpires from './MenuEmpires';
import MenuMapSelect from './MenuMapSelect';

// import { useMenuSettings } from './SettingContext';



function Menu(){

    // const { 
    //     draftEmpires,
    //     activeEmpireId,    
    //     // updateDraftSetting,
    //     // updateEmpireName,
    //     // updateEmpireColor, 
    //     // setActiveEmpireId, 
    //     // addEmpire,
    //     // commitSettings,   
    // } = useMenuSettings();

    // const activeEmpire = draftEmpires.find(empire => empire.id === activeEmpireId)

    return (
        <>
            <div className="menu_container">
                <MenuMapSelect />
                <MenuEmpires />
            </div>
        </>
    )
}

export default Menu;
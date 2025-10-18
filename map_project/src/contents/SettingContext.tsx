import React, { useState, useContext, createContext, useMemo, useCallback, ReactNode } from 'react';

// --- 1. TYPESCRIPT INTERFACES & INITIAL VALUES ---

export interface CountrySliderValues{
    water : number,
    river : number,
    plain : number,
    mountain : number,
    desert : number,
    forest : number,
    ice : number,
    size: number,
}

export interface EmpireConfig{
    id: number,
    name: string,
    color: string,
    settings: CountrySliderValues,
}



export interface SettingsContextType{
    draftEmpires: EmpireConfig[],
    committedEmpires: EmpireConfig[], 
    activeEmpireId: number,  
    activeMap: string,      

    updateDraftSetting: (empireID: number, key: keyof CountrySliderValues, value: number) => void;
    updateEmpireName: (empireID: number, value: string) => void;
    updateEmpireColor: (empireID: number, value: string) => void
    setActiveEmpireID: (id: number) => void;
    addEmpire: () => void;
    deleteEmpire: (id: number) => void
    setActiveMap: (mapName: string) => void;

    commitSettings: () => void;
}

export const initialEmpireConfig: CountrySliderValues = {
    water : 2.0,
    river : 1.5,
    plain : 1.0,
    mountain : 5.0,
    desert : 5.5,
    forest : 2.5,
    ice : 8.0,
    size: 10000,
}


// export const initialEmpireConfig: CountrySliderValues = {
//     water : 1.0,
//     river : 1.5,
//     plain : 2.0,
//     mountain : 6.0,
//     desert : 4.0,
//     forest : 3.0,
//     ice : 7.0,
//     size: 2000,
// }

export const initialEmpires: EmpireConfig[] = [
    { id: 1, name: "Empire1 Cat", color: '#F965B9', settings: initialEmpireConfig},
    { id: 2, name: "Empire2 Ben", color: '#B51121', settings: {...initialEmpireConfig, mountain: 5}},
    { id: 3, name: "Empire2 Otter", color: '#25F9F9', settings: {...initialEmpireConfig, river: 1}}
]

export const initialContext: SettingsContextType = {
    draftEmpires: initialEmpires,
    committedEmpires: initialEmpires,
    activeEmpireId: 1,
    activeMap: "world",

    updateDraftSetting: () => {},
    updateEmpireName: () => {},
    updateEmpireColor: () => {},
    setActiveEmpireID: () => {},
    addEmpire: () => {},
    deleteEmpire: () => {},
    setActiveMap: () => {},

    commitSettings: () => {},
}

export const SettingsContext = createContext<SettingsContextType>(initialContext)

export const useMapSettings = () => {
    const context = useContext(SettingsContext);

    return { 
        committedEmpires: context.committedEmpires,
        activeEmpireId: context.activeEmpireId,
        activeMap: context.activeMap,
    } 
}

export const useMenuMapSettings = () => {
    const context = useContext(SettingsContext)

    return {
        activeMap: context.activeMap,
        setActiveMap: context.setActiveMap,
    }
}

export const useMenuSettings = () => {
    const context = useContext(SettingsContext);
    return {
        draftEmpires: context.draftEmpires, 
        activeEmpireId: context.activeEmpireId,
        updateDraftSetting: context.updateDraftSetting,
        updateEmpireName: context.updateEmpireName,
        updateEmpireColor: context.updateEmpireColor, 
        setActiveEmpireId: context.setActiveEmpireID,
        addEmpire: context.addEmpire,
        deleteEmpire: context.deleteEmpire,
        commitSettings: context.commitSettings
    }
}






export interface SettingsProviderProps{
    children: ReactNode,
}

export const SettingsProvider = ({ children }: SettingsProviderProps ) => {
    const [ draftEmpires, setDraftEmpires ] = useState<EmpireConfig[]>(initialEmpires);
    const [ committedEmpires, setCommittedEmpires ] = useState<EmpireConfig[]>(initialEmpires); 
    const [ activeEmpireID, setActiveEmpireID ] = useState<number>(1);
    const [ activeMap, setActiveMap ] = useState<string>("world");

    const updateDraftSetting = useCallback((id: number, key: keyof CountrySliderValues, value: number) => {
        // const auxValue = Math.min(100, Math.max(1, value))

        setDraftEmpires(prevEmpires => prevEmpires.map(empire => {
            if ( empire.id === id){
                return {
                    ...empire,
                    settings: {
                        ...empire.settings,
                        [key]: value,
                    }
                }
            }
            return empire
        }))
    }, [])

    const updateEmpireName = useCallback((id: number, name: string) => {
        setDraftEmpires(prevEmpires => prevEmpires.map(empire => {
            if ( empire.id === id ){
                return {
                    ...empire,
                    name: name,
                }
            }
            return empire
        }))
    }, [])

    const updateEmpireColor = useCallback((id: number, color: string) => {
        setDraftEmpires(prevEmpires => prevEmpires.map(empire => {
            if ( empire.id === id ){
                return {
                    ...empire,
                    color: color,
                }
            }
            return empire
        }))
    }, [])

    const addEmpire = useCallback(() => {
        const newID = draftEmpires.length + 1
        const newColor = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
        const newEmpire = {
            id: newID,
            name: `Empire${newID}`,
            color: `#${newColor.toUpperCase()}`,
            settings: initialEmpireConfig,
        }

        const newEmpires = [...draftEmpires, newEmpire]

        setDraftEmpires(newEmpires)
        setCommittedEmpires(newEmpires)
        setActiveEmpireID(newID)
    }, [draftEmpires])

    const deleteEmpire = useCallback((id: number) => {
        setDraftEmpires(prevEmpires => 
            prevEmpires.filter(empire => empire.id !== id)
        )
    }, [])

    const commitSettings = useCallback(() =>{
        setCommittedEmpires(draftEmpires) 
    }, [draftEmpires])

    const contextValue = useMemo(() => ({
        draftEmpires,
        committedEmpires,
        activeEmpireId: activeEmpireID,
        activeMap,
        updateDraftSetting,
        updateEmpireName,
        updateEmpireColor,
        setActiveEmpireID,
        addEmpire,
        deleteEmpire,
        setActiveMap,
        commitSettings,
    }), [draftEmpires, committedEmpires, activeEmpireID, activeMap, updateDraftSetting, updateEmpireName, updateEmpireColor, addEmpire, deleteEmpire, setActiveMap, commitSettings])

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    )
}

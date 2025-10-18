
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../style/Map.css';
import { useMapSettings } from './SettingContext';

import { searchTer, findNClosestCells } from '../resources/mapLgorithm';


// FROM RUST
import init, {MapCalc} from 'map-algorithm-wasm'







type Owner_Value = {
    owner: number,
    cost: number,
}


///actual fetch
const getMap = async (mapName: string): Promise<string[][]> => {
    // return MP.europe.mapData.map(row => 
    //     row.map( cell => cell )
    // )
    const response = await fetch(`/resources/maps/${mapName}.txt`);

    if (response.ok) {
        const textData = await response.text();
        return textData
                .split('\n')
                .filter(l => l.length)          
                .map(row => Array.from(row));
    } else {
        throw new Error(`Failed to load map: ${response.status} ${response.statusText}`);
    }
}

const TerrainKeysRust: {[key: string]: number} = {
    'W': 1, // Water (Blue)
    'R': 2, // River
    'M': 4, // Mountain (Brown/Gray)
    'P': 3, // Plain (Dark Green)
    "F" : 6, // Forest
    "D" : 5, // Desert
    "I" : 7, // Ice
}

const TerrainColors:{[key: string]: string; default: string} = {
    // 0: '#4A90E2', // Water (Blue)
    // 1: '#4bc3d5ff', // River
    // 4: '#795548', // Mountain (Brown/Gray)
    // 3: '#388E3C', // Plain (Dark Green)
    'W': '#4A90E2', // Water (Blue)
    'R': '#4bc3d5ff', // River
    'M': '#795548', // Mountain (Brown/Gray)
    'P': '#388E3C', // Plain (Dark Green)
    "F" : '#052607', // Forest
    "D" : '#74862dff', // Desert
    "I" : '#ffffff', // Ice
    default: '#D3D3D3' // Unknown (Light Gray)
}


const debounce = (func: Function, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};


// !!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!


function Map(){

    // RUST USAGE
    const [mapObject, setMapObject]  = useState<MapCalc | null>(null)
    const [searching, setSearch] = useState<boolean>(false)




    
    const { 
        committedEmpires,
        activeEmpireId,
        activeMap,
    } = useMapSettings();
    
    const [ MapData, setMapData ] = useState<string[][]>([]);
    const [ mapRow, setMapRow ] = useState<number>(0);
    const [ mapCol, setMapCol ] = useState<number>(0);
    const [ ownershipData, setOwnershipData ] = useState<Owner_Value[][]>([])
    const [ capitalLocations, setCapitalLocations ] = useState<Map<number, [number, number]>>(new globalThis.Map())

    const activeEmpire = committedEmpires.find(empire => empire.id === activeEmpireId)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const canvasOwner = useRef<HTMLCanvasElement>(null)

    const IdColor = useMemo(() => {
        const maaaap = new globalThis.Map<number, string>();
        committedEmpires.forEach(empire => {
            maaaap.set(empire.id, empire.color)
        })
        return maaaap;
    } ,[committedEmpires])

     ///fecth map + Rust borning of MapObject
    useEffect(() => {
        let wasm: MapCalc | null = null;

        setOwnershipData([])
        setMapData([])
        setMapRow(0)
        setMapCol(0)
        setCapitalLocations(new globalThis.Map())

        const fetchMap = async () => {
            try{
                await init();
                wasm = new MapCalc();

                const data = await getMap(activeMap);

                setMapData(data)
                setMapRow(data.length)
                setMapCol(data[0].length)

                const flat = data.flat().map(col => TerrainKeysRust[col]);
                console.log("JS  rows:", data.length,
                                "cols:", data[0].length,
                                "flat length:", flat.length,
                                "expected:", data.length * data[0].length);

                console.log("before flat – outer length:", data.length);
console.log("last inner array:", JSON.stringify(data.at(-1)));

                // Using RUST
                wasm.load_data(
                    new Uint8Array(
                        flat
                    ), 
                    data.length
                )

                console.log(data.length * data[0].length)

                setMapObject(wasm)
                wasm = null

            } catch (error){
                console.log("An error occured in loading map data", error)
                setMapData([]);
            }
        }
        fetchMap()

        return () => {
            wasm?.free?.()
        };
        
    }, [activeMap]);

    //// setting ownership data to 0
    useEffect(() => {
        if ( mapRow > 0 && mapCol > 0){
            const initialOwnership = Array.from({ length: mapRow}, () => {
                return Array.from({length: mapCol}, () => ({ owner: 0, cost: Infinity}))
            })
            setOwnershipData(initialOwnership)
        }
    }, [MapData, mapRow, mapCol]) 

    
    const drawMap = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return;
        
        const { width: canvasW, height: canvasH} = canvas;
        
        const tileH = canvasH / mapRow;
        const tileW = canvasW / mapCol;

        ctx.clearRect(0,0, canvasW, canvasH)
        
        for( let row = 0; row < mapRow; row++ ){
            for ( let col = 0; col < mapCol; col++ ){
                const color = TerrainColors[MapData[row][col] as keyof typeof TerrainColors] || TerrainColors.default
                
                ctx.fillStyle = color;
                
                ctx.fillRect( col * tileW, row * tileH, tileW, tileH)
                // ctx.strokeStyle = 'rgba(34, 34, 34, 0.1)'; // Lighter grid line
                // ctx.lineWidth = 0.5;
                // ctx.strokeRect(col * tileW, row * tileH, tileW, tileH);
            }
        }
        
    }, [MapData, mapRow, mapCol])

    const ownerDrawMap = useCallback(() => {
        const ownerCanvas = canvasOwner.current;
        const refCanvas = canvasRef.current

        if ( !ownerCanvas || !refCanvas ) return

        const ctxOwner = ownerCanvas.getContext('2d')
        if (!ctxOwner ) return

        const { width: canvasW, height: canvasH} = refCanvas;

        if (ownershipData.length === 0 || ownershipData[0].length === 0) {
            return; 
        }
    
        const tileH = canvasH / mapRow;
        const tileW = canvasW / mapCol;

        ctxOwner.clearRect(0, 0, canvasW, canvasH)

        ctxOwner.globalAlpha = 0.6;

        for (let row = 0; row < mapRow; row++ ){
            for (let col = 0; col < mapCol; col++ ){
                const ownerId = ownershipData[row][col].owner;
                if ( ownerId === 0 ){
                    continue;
                }
                
                const color = IdColor.get(ownerId);
                if ( !color ) continue;

                ctxOwner.fillStyle = color;
                ctxOwner.fillRect( col * tileW, row * tileH, tileW, tileH);
            }
        }

        ctxOwner.globalAlpha = 1.0;
        ctxOwner.fillStyle = '#000000'; 
        const dotRadius = Math.min(tileW, tileH) * 1;

        capitalLocations.forEach((coords: [number, number], empireId: number) => {
        const [row, col] = coords;
        
        const centerX = col * tileW + tileW / 2;
        const centerY = row * tileH + tileH / 2;
        
        ctxOwner.beginPath();
        ctxOwner.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
        ctxOwner.fill();
        
        ctxOwner.strokeStyle = '#FFFFFF'; 
        ctxOwner.lineWidth = 1;
        ctxOwner.stroke();
    });

    }, [ownershipData, IdColor, mapRow, mapCol, capitalLocations])

    //// redraw map when needed
    useEffect(() => {
        if ( mapRow > 0 ){
            drawMap()
        }
    }, [drawMap, mapRow, mapCol])

    /// redraw onwermap whne change of ownershipdata
    useEffect(() => {
        if ( mapRow > 0 && mapCol > 0 ){
            ownerDrawMap()
        }
    }, [ownershipData, ownerDrawMap, mapCol, mapRow])

    // resize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const ownerCanvas = canvasOwner.current;
        if (!canvas || !ownerCanvas) return;

        const container = canvas.parentElement;
        if (!container) return;

        const resizeCanvas = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            ownerCanvas.width = container.clientWidth;
            ownerCanvas.height = container.clientHeight;

            drawMap();
            ownerDrawMap();
        }

        resizeCanvas()

        const debouncedResize = debounce(resizeCanvas, 150)

        window.addEventListener('resize', debouncedResize);

        return () => {
            window.removeEventListener('resize', debouncedResize);
        };

    }, [drawMap, ownerDrawMap])

    const handleMapClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {

        if ( capitalLocations.has(activeEmpireId) || searching || !mapObject) return

        let canvas = canvasRef.current;
        if (!canvas){
            console.log("CANVAS NOT FOUND")
            return
        }

        const rect = canvas.getBoundingClientRect();

        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const canvasX = x * (canvas.width / rect.width);
        const canvasY = y * (canvas.height / rect.height);

        // console.log(`Canvas Coordinates: (${canvasX}, ${canvasY})`);

        const { width: canvasW, height: canvasH} = canvas;
        
        const tileH = canvasH / mapRow;
        const tileW = canvasW / mapCol;

        const mapGridX = Math.floor(canvasX / tileW);
        const mapGridY = Math.floor(canvasY / tileH);

        console.log(mapGridY, mapGridX)

        if ( mapGridX < 0 || mapGridY < 0 || mapGridX >= mapCol || mapGridY >= mapRow) return

        setCapitalLocations(prevCap => {
            const newCap = new globalThis.Map(prevCap)
            newCap.set(activeEmpireId, [mapGridY, mapGridX])
            return newCap
        })

        // setOwnershipData(prevOwner => {
        //     const newOwner = prevOwner.map(row => [...row])
            
        //     let distGrid = searchTer(
        //         MapData,
        //         {row: mapGridY, col: mapGridX},
        //         {
        //             "W": activeEmpire ? activeEmpire.settings.water : 0,
        //             "R": activeEmpire ? activeEmpire.settings.river : 0,
        //             "P": activeEmpire ? activeEmpire.settings.plain : 0,
        //             "M": activeEmpire ? activeEmpire.settings.mountain : 0,
        //             "D": activeEmpire ? activeEmpire.settings.desert : 0,
        //             "F": activeEmpire ? activeEmpire.settings.forest : 0,
        //             "I": activeEmpire ? activeEmpire.settings.ice : 0,
        //         }
        //     )

        //     console.log(distGrid)

        //     let pointsCountry = findNClosestCells(
        //         distGrid,
        //         activeEmpire ? activeEmpire.settings.size : 1000,
        //         MapData
        //     )

        //     console.log(pointsCountry)

        //     pointsCountry.forEach(cell => {
        //         const currentCls = newOwner[cell.point.row][cell.point.col].cost

        //         if ( cell.cost < currentCls ){
        //             newOwner[cell.point.row][cell.point.col].owner = activeEmpireId
        //             newOwner[cell.point.row][cell.point.col].cost = cell.cost
        //         }
        //     })
            
        //     // newOwner[mapGridY][mapGridX] = activeEmpireId
        //     console.log(newOwner)
        //     return newOwner
        // })

        const terrainKeys = Uint8Array.from([1, 2, 3, 4, 5, 6, 7])
        const terrainCosts = Float64Array.from(
            [
                activeEmpire ? activeEmpire.settings.water : 0,
                activeEmpire ? activeEmpire.settings.river : 0,
                activeEmpire ? activeEmpire.settings.plain : 0,
                activeEmpire ? activeEmpire.settings.mountain : 0,
                activeEmpire ? activeEmpire.settings.desert : 0,
                activeEmpire ? activeEmpire.settings.forest : 0,
                activeEmpire ? activeEmpire.settings.ice : 0,
            ]
        )

        console.log("Click coordinates { row, col}:", { mapGridY, mapGridX });
        console.log("Map dimensions:", { mapRow, mapCol });

        setSearch(true)
        console.log("ENTERED RUST FUNCTION")
        const result = mapObject.searchTer(
            mapGridY, 
            mapGridX, 
            activeEmpireId, 
            activeEmpire ? activeEmpire.settings.size : 0,
            terrainKeys,
            terrainCosts
        )
        setSearch(false)

        console.log(result.costs())

        const costs: number[] = Array.from(result.costs()); // Float64Array -> number[]
        const owner: number[] = Array.from(result.owner()); // Uint8Array   -> number[]
        console.log("First few ownership values:", owner.slice(0, 10));
        console.log("First few costs values:", costs.slice(0, 10));
        console.log("Expected index for clicked cell:", mapGridY * mapCol + mapGridX);
        console.log("Ownership at clicked cell:", owner[mapGridY * mapCol + mapGridX]);
        console.log("Cost at clicked cell:", costs[mapGridY * mapCol + mapGridX]);
        // console.log(owner)

        // if you want a 2-D matrix matching mapRow × mapCol:
        const newMatrix: { owner: number; cost: number }[][] = [];
        for (let r = 0; r < mapRow; r++) {
            const row: { owner: number; cost: number }[] = [];
            for (let c = 0; c < mapCol; c++) {
                const idx = r * mapCol + c;
                row.push({ owner: owner[idx], cost: costs[idx] });
            }
            newMatrix.push(row);
            // console.log("Row number ",r, ": ", row)
        }

        setOwnershipData(newMatrix)

    }, [mapRow, mapCol, activeEmpireId, activeEmpire, capitalLocations, MapData, mapObject, searching])

    return (
        <>
            <div className="map_container">
                <div className="map_header">
                    
                </div>
                <div className="map">
                    <canvas 
                        className="map_canvas"
                        ref={canvasRef}
                        style={{ display: 'block', width: '100%', height: '100%' }}
                        onClick={handleMapClick}
                    />
                    <canvas 
                        className='owner_canvas'
                        ref={canvasOwner}
                        style={{ display: 'block', width: '100%', height: '100%' }}
                    />
                </div>
            </div>
        </>
    )
}

export default Map;
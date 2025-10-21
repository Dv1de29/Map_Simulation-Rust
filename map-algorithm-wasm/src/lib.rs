#![allow(non_camel_case_types)]
#![allow(non_snake_case)]


use wasm_bindgen::prelude::*;
use web_sys::console;
use std::{collections::*, usize};


mod map_utility;
use map_utility::{Task, Ix2, MaxHeapElement};


// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// REMEMBER THAT I ONLY IMPLEMENTED THE SEACRH_TER FUNCTION WITHOUT PENALTIES ADDED, I NEED TO ALSO ADD THE PENALTIES
// ALSO SEE IF I WANT TO ADD FOREIGN EMPIRE TERRITORY EMPIRE



// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// MUST IMPROVE THE ALGORITHM TO AN O(V+E) IF POSSIBLE



#[wasm_bindgen]
#[derive(Debug)]
pub struct SearchResult {
    costs: Vec<f64>,
    owner: Vec<u8>,
}

#[wasm_bindgen]
impl SearchResult{
    pub fn new() -> SearchResult{
        SearchResult{costs: vec![], owner: vec![]}
    }

    pub fn costs(&self) -> Vec<f64>{
        self.costs.clone()
    }

    pub fn owner(&self) -> Vec<u8>{
        self.owner.clone()
    }
}



#[wasm_bindgen]
pub struct MapCalc{
    inner: MapCalcData,
}


impl MapCalcData {
    /// row-major index → 2-D coordinate
    pub fn to_ix(&self, idx: usize) -> Option<Ix2> {
        if idx < self.mapData.len() {
            Some(Ix2::new(idx / self.mapCol, idx % self.mapCol))
        } else {
            None
        }
    }

    /// 2-D coordinate → row-major index
    pub fn to_idx(&self, ix: Ix2) -> Option<usize> {
        if ix.r < self.mapRow && ix.c < self.mapCol {
            Some(ix.r * self.mapCol + ix.c)
        } else {
            None
        }
    }
}

pub struct MapCalcData{
    mapData: Vec<u8>,
    mapOwner: Vec<u8>,
    mapCosts: Vec<f64>,
    mapRow: usize,
    mapCol: usize,
}


#[wasm_bindgen]
impl MapCalc{

    #[wasm_bindgen(constructor)]
    pub fn new() -> MapCalc {
        MapCalc{
            inner: MapCalcData {
                mapData: Vec::new(),
                mapOwner: Vec::new(),
                mapCosts: Vec::new(),
                mapRow: 0,
                mapCol: 0,
            }
        }
    }


    #[wasm_bindgen]
    pub fn load_data(
        &mut self,
        mapData: Box<[u8]>,
        mapRow: usize,
    ){
        // console::log_1(&format!(
        //     "Entered mapData lenght: {}\nRows: {}",
        //     mapData.len(),
        //     mapRow,
        // )
        // .into());

        self.inner.mapRow = mapRow;
        self.inner.mapCol = mapData.len() / mapRow;  
        self.inner.mapData = mapData.to_vec();
        self.inner.mapOwner.clear();
        self.inner.mapCosts.clear();
        self.inner.mapOwner.resize(self.inner.mapRow*self.inner.mapCol, 0);
        self.inner.mapCosts.resize(self.inner.mapRow*self.inner.mapCol, f64::INFINITY)         
    }
  
    #[wasm_bindgen]
    pub fn searchTer(
        &mut self,
        startR: usize,
        startC: usize,
        empireId: u8,
        n_size: usize,
        terrainKeys: Vec<u8>,
        terrainCosts: Vec<f64>
    ) -> SearchResult{
        // console::log_1(&format!(
        //         "Entered parameters:\n
        //         startR: {}\nstartC: {}\n
        //         empireID: {}\n
        //         n_size: {}\n

        //         Map limits: {}, {}",
        //         startR,
        //         startC,
        //         empireId,
        //         n_size,

        //         self.inner.mapRow,
        //         self.inner.mapCol,
        //     ).into());


        // OUT OF BOUNDS ERROR CLAUSE
        if startR >= self.inner.mapRow || startC >= self.inner.mapCol {  
            console::log_1(&format!(
                "EXIT on limit bounds!\nClicked: {}, {}\nMap limits: {},{}",
                startR,
                startC,
                self.inner.mapRow,
                self.inner.mapCol,
            ).into());
            return SearchResult::new();
        }


        // WRONG FORMAT FOR KEYS AND COSTS
        if terrainKeys.len() != terrainCosts.len() {
            console::log_1(&format!(
                "TerrainKeys X TerrainCosts wrong lenghts {},{}",
                terrainKeys.len(),
                terrainCosts.len(),
            ).into());
            return SearchResult::new();
        }


        // EMPIRE ID NULL
        if empireId == 0{
            console::log_1(&format!(
                "Empire ID is 0",
            ).into());
            return SearchResult::new();
        }

        // console::log_1(&format!(
        //     "Map dimensions {}, {}",
        //     &(self.inner.mapRow),
        //     &(self.inner.mapCol)
        // )
        //     .into());

        // console::log_1(&format!(
        //     "Clicked tiles {}, {}",
        //     &startR,
        //     &startC
        // )
        //     .into());


        let mut cost_tbl: HashMap<u8, f64> = HashMap::new();
        for (&k, &v) in terrainKeys.iter().zip(&terrainCosts){
            cost_tbl.insert(k, v);
        }
        

        self.inner.djikstra(
            Ix2::new(startR, startC),
            empireId,
            n_size,
            cost_tbl,
        );

        // console::log_1(&format!(
        //     "EXITED DJIKSTRA FUNCTION WITH MAP LENGHT: {}\nMAP ROW: {}\n MAPCOL: {}",
        //     self.inner.mapData.len(),
        //     self.inner.mapRow,
        //     self.inner.mapCol,
        // ).into());


        SearchResult{
            costs: self.inner.mapCosts.clone(), 
            owner: self.inner.mapOwner.clone(),
        }
    }
}



impl MapCalcData{
    pub fn djikstra(
        
        &mut self,
        start: Ix2,
        empireId: u8,
        n_size: usize,
        cost_tbl: HashMap<u8, f64>,
    ){

        let start_idx = match self.to_idx(start) {
            Some(i) => i,
            None => return,
        };

        let mut empire_costs = vec![f64::INFINITY; self.mapRow * self.mapCol];
        empire_costs[start_idx] = 0.0;


        let dirs: [(isize, isize); 4] = [(-1, 0), (1, 0), (0, -1), (0, 1)];

        let mut pq: VecDeque<Task> = VecDeque::new();
        self.mapCosts[start_idx] = 0.0;
        self.mapOwner[start_idx] = empireId;
        let initialTerrian = self.mapData[start_idx];
        pq.push_back((0.0, start_idx, initialTerrian));

        let mut heap: BinaryHeap<MaxHeapElement> = BinaryHeap::new();


        while let Some((cur_cost, cur_idx, cur_terrain)) = pq.pop_front() {
            if cur_cost > empire_costs[cur_idx]{
                continue;
            }

            let cur_ix = self.to_ix(cur_idx).unwrap();
            for ( dr, dc ) in dirs{
                let nr = cur_ix.r.wrapping_add_signed(dr);
                let nc = cur_ix.c.wrapping_add_signed(dc);

                if nr >= self.mapRow || nc >= self.mapCol{
                    continue;
                }

                let Some(n_idx) = self.to_idx(Ix2::new(nr, nc)) else {
                    continue;
                };

                let neibType = self.mapData[n_idx];
                let travel_cost = cost_tbl.get(&neibType).unwrap_or(&f64::INFINITY);

                if travel_cost.is_infinite() {
                    continue;
                }

                let new_cost = cur_cost + travel_cost;
                if new_cost < empire_costs[n_idx]{
                    empire_costs[n_idx] = new_cost;
                    // self.mapOwner[n_idx] = empireId;
                    // heap.push(MinHeapElement { priority: new_cost, index: n_idx });

                    pq.push_back((new_cost, n_idx, neibType));
                }
            }
        }


        for (index, &cost) in empire_costs.iter().enumerate(){
            if self.mapData[index] == 1 {
                continue;
            }
            if heap.len() < n_size {
                heap.push(MaxHeapElement { priority: cost, index: index });
            }
            else if let Some(top) = heap.peek() {
                if cost < top.priority {
                    heap.pop();                 
                    heap.push(MaxHeapElement { priority: cost, index: index });
                }
            }
        }

        // println!("{:?}", heap);
        for _ in 1..n_size{
            if let Some(popped) = heap.pop(){
                if self.mapCosts[popped.index] > empire_costs[popped.index]{
                    self.mapCosts[popped.index] = empire_costs[popped.index];
                    self.mapOwner[popped.index] = empireId;
                }
            }
            else{
                break;
            }
        }

        self.mapCosts[start_idx] = 0.0;
        self.mapOwner[start_idx] = empireId;

    }
}






#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let mut map = MapCalc::new();
        let mapdata: Box<[u8]> = vec![1,2,3,4,1,1,1,2,2,4,2,3,2,3,1]
                                                                .into_boxed_slice();
        map.load_data(mapdata, 5);

        let res: SearchResult = map.searchTer(1, 2, 5, 5, vec![1,2,3,4], vec![1.0,1.5,1.3,2.0]);

        println!("{:?}\n\n", res);

        let mapcostsres1 = res.costs.clone();
        let mapownerres1 = res.owner.clone();


        let res2 = map.searchTer(1, 1, 3, 8, vec![1,2,3,4], vec![1.0,1.5,1.3,2.0]);
        println!("Res1: {:?}", mapcostsres1);
        println!("Res2: {:?}\n", res2.costs());
        println!("Res1: {:?}", mapownerres1);
        println!("Res2: {:?}", res2.owner());
    }
}

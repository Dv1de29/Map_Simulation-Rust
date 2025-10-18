use std::cmp::Ordering;

pub type Task = (f64, usize, u8);


#[derive(Copy, Clone, Debug)]
pub struct Ix2 {
    pub r: usize,
    pub c: usize,
}

impl Ix2 {
    pub fn new(r: usize, c: usize) -> Self {
        Ix2 { r, c }
    }
}


#[derive(Debug, PartialEq)]
pub struct MinHeapElement {
    pub priority: f64,
    pub index: usize,
}

impl Eq for MinHeapElement {}

impl Ord for MinHeapElement {
    fn cmp(&self, other: &Self) -> Ordering {
        // Use total_cmp on the f64 values for total ordering (handles NaN/Inf).
        // The comparison is REVERSED (other vs self) to create a MIN-HEAP.
        match other.priority.total_cmp(&self.priority) {
            
            // If f64 priorities are equal, the Ord implementation requires a tiebreaker.
            // Since you don't care about Ix2 ordering, we simply return Equal.
            // Note: This makes the tie-breaker arbitrary (whatever the heap decides).
            Ordering::Equal => Ordering::Equal, 
            
            // Otherwise, return the result of the reversed f64 comparison.
            order => order,
        }
    }
}

impl PartialOrd for MinHeapElement {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        // Delegate to the Ord implementation, which is guaranteed to return Some(Ordering).
        Some(self.cmp(other))
    }
}



#[derive(Debug, PartialEq)]
pub struct MaxHeapElement {
    pub priority: f64,
    pub index: usize,
}

impl Eq for MaxHeapElement {}

impl Ord for MaxHeapElement {
    fn cmp(&self, other: &Self) -> Ordering {
        // natural order: bigger priority wins → max-heap
        self.priority
            .total_cmp(&other.priority)          // NOT reversed
            .then_with(|| self.index.cmp(&other.index)) // stable tie-break
    }
}

impl PartialOrd for MaxHeapElement {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
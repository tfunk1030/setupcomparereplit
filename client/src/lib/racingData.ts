// Common iRacing cars organized by class
export const commonCars = [
  // GT3
  { value: "BMW M4 GT3", label: "BMW M4 GT3", class: "GT3" },
  { value: "Mercedes AMG GT3 Evo", label: "Mercedes AMG GT3 Evo", class: "GT3" },
  { value: "Porsche 911 GT3 R", label: "Porsche 911 GT3 R", class: "GT3" },
  { value: "Ferrari 296 GT3", label: "Ferrari 296 GT3", class: "GT3" },
  { value: "Lamborghini Huracan GT3 EVO", label: "Lamborghini Huracan GT3 EVO", class: "GT3" },
  { value: "Audi R8 LMS EVO II GT3", label: "Audi R8 LMS EVO II GT3", class: "GT3" },
  
  // Formula
  { value: "Dallara iR-01", label: "Dallara iR-01", class: "Formula" },
  { value: "Dallara F3", label: "Dallara F3", class: "Formula" },
  { value: "Ray FF1600", label: "Ray FF1600", class: "Formula" },
  { value: "Super Formula SF23", label: "Super Formula SF23", class: "Formula" },
  { value: "FIA F4", label: "FIA F4", class: "Formula" },
  
  // NASCAR
  { value: "NASCAR Cup Series Next Gen", label: "NASCAR Cup Series Next Gen", class: "NASCAR" },
  { value: "NASCAR Xfinity", label: "NASCAR Xfinity", class: "NASCAR" },
  { value: "NASCAR Truck", label: "NASCAR Truck", class: "NASCAR" },
  { value: "ARCA Menards", label: "ARCA Menards", class: "NASCAR" },
  
  // LMP
  { value: "Dallara P217 LMP2", label: "Dallara P217 LMP2", class: "LMP" },
  { value: "HPD ARX-01c", label: "HPD ARX-01c", class: "LMP" },
  { value: "Porsche 963 GTP", label: "Porsche 963 GTP", class: "LMP" },
  { value: "Cadillac V-Series.R GTP", label: "Cadillac V-Series.R GTP", class: "LMP" },
  
  // Touring Cars
  { value: "Hyundai Elantra N TC", label: "Hyundai Elantra N TC", class: "Touring" },
  { value: "Honda Civic Type R", label: "Honda Civic Type R", class: "Touring" },
  { value: "Audi RS 3 LMS", label: "Audi RS 3 LMS", class: "Touring" },
  
  // MX-5
  { value: "Global Mazda MX-5 Cup", label: "Global Mazda MX-5 Cup", class: "MX-5" },
  { value: "Mazda MX-5 Cup 2016", label: "Mazda MX-5 Cup 2016", class: "MX-5" },
];

// Common iRacing tracks organized by type
export const commonTracks = [
  // Road Courses
  { value: "Spa-Francorchamps", label: "Spa-Francorchamps", type: "Road" },
  { value: "Silverstone", label: "Silverstone", type: "Road" },
  { value: "Monza", label: "Monza", type: "Road" },
  { value: "Suzuka International Racing Course", label: "Suzuka", type: "Road" },
  { value: "Nürburgring Grand Prix", label: "Nürburgring GP", type: "Road" },
  { value: "Nürburgring Nordschleife", label: "Nordschleife", type: "Road" },
  { value: "Watkins Glen International", label: "Watkins Glen", type: "Road" },
  { value: "Road America", label: "Road America", type: "Road" },
  { value: "Brands Hatch", label: "Brands Hatch", type: "Road" },
  { value: "Imola", label: "Imola", type: "Road" },
  { value: "Red Bull Ring", label: "Red Bull Ring", type: "Road" },
  { value: "Mount Panorama", label: "Mount Panorama", type: "Road" },
  { value: "Interlagos", label: "Interlagos", type: "Road" },
  { value: "Circuit de Barcelona-Catalunya", label: "Barcelona", type: "Road" },
  { value: "Hockenheimring", label: "Hockenheim", type: "Road" },
  { value: "Sebring International Raceway", label: "Sebring", type: "Road" },
  { value: "Virginia International Raceway", label: "VIR", type: "Road" },
  { value: "Okayama International Circuit", label: "Okayama", type: "Road" },
  { value: "Philip Island Circuit", label: "Philip Island", type: "Road" },
  { value: "Oulton Park", label: "Oulton Park", type: "Road" },
  
  // Ovals
  { value: "Daytona International Speedway", label: "Daytona", type: "Oval" },
  { value: "Indianapolis Motor Speedway", label: "Indianapolis", type: "Oval" },
  { value: "Talladega Superspeedway", label: "Talladega", type: "Oval" },
  { value: "Charlotte Motor Speedway", label: "Charlotte", type: "Oval" },
  { value: "Texas Motor Speedway", label: "Texas", type: "Oval" },
  { value: "Las Vegas Motor Speedway", label: "Las Vegas", type: "Oval" },
  { value: "Michigan International Speedway", label: "Michigan", type: "Oval" },
  { value: "Phoenix Raceway", label: "Phoenix", type: "Oval" },
  { value: "Richmond Raceway", label: "Richmond", type: "Oval" },
  { value: "Bristol Motor Speedway", label: "Bristol", type: "Oval" },
  { value: "Martinsville Speedway", label: "Martinsville", type: "Oval" },
  { value: "Iowa Speedway", label: "Iowa", type: "Oval" },
  { value: "Gateway Motorsports Park", label: "Gateway", type: "Oval" },
  { value: "Darlington Raceway", label: "Darlington", type: "Oval" },
  
  // Street Circuits
  { value: "Long Beach Street Circuit", label: "Long Beach", type: "Street" },
  { value: "Detroit Belle Isle", label: "Detroit", type: "Street" },
  { value: "Circuit de Monaco", label: "Monaco", type: "Street" },
  
  // Roval
  { value: "Charlotte Motor Speedway - Roval", label: "Charlotte Roval", type: "Roval" },
  { value: "Daytona International Speedway - Road", label: "Daytona Road", type: "Roval" },
  { value: "Indianapolis Motor Speedway - Road", label: "Indy Road", type: "Roval" },
];

// Helper function to get car class
export function getCarClass(carName: string): string | undefined {
  const car = commonCars.find(c => c.value === carName);
  return car?.class;
}

// Helper function to get track type
export function getTrackType(trackName: string): string | undefined {
  const track = commonTracks.find(t => t.value === trackName);
  return track?.type;
}
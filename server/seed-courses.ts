import { db } from "./db";
import { trainingProviders, courses, courseLessons, courseQuizQuestions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

const providers = [
  { id: "14d8b6c4-9dc9-4204-920b-7860d26b691e", name: "Booker Washington Institute (BWI)", county: "Margibi", accreditationStatus: "accredited", isActive: true },
  { id: "43dbe006-29f5-46a1-afc9-b331a9a16645", name: "LICS Vocational Training Centre", county: "Montserrado", accreditationStatus: "accredited", isActive: true },
  { id: "9ea780ca-bf9d-4bc3-9748-7c154f3785f2", name: "Monrovia Vocational Training Center (MVTC)", county: "Montserrado", accreditationStatus: "accredited", isActive: true },
  { id: "4783f590-98b9-4e95-af40-272421921ee8", name: "Don Bosco Polytechnic", county: "Montserrado", accreditationStatus: "accredited", isActive: true },
  { id: "2ad191b8-f828-42cb-a55b-48e62bced671", name: "Liberia Opportunity Industrialization Center (LOIC)", county: "Montserrado", accreditationStatus: "accredited", isActive: true },
  { id: "2db109c5-ddad-4e80-a739-b494e2db1642", name: "Nimba County Community College", county: "Nimba", accreditationStatus: "accredited", isActive: true },
  { id: "f157d310-912a-46f5-be63-d6940d07713f", name: "Grand Bassa Community College", county: "Grand Bassa", accreditationStatus: "accredited", isActive: true },
  { id: "7c271d40-4c01-433a-948b-5afd7a8dfc27", name: "Bong County Technical College", county: "Bong", accreditationStatus: "pending", isActive: true },
  { id: "79dbcd0e-3827-4049-8b29-362cd6a8e4a6", name: "Lofa County Vocational Institute", county: "Lofa", accreditationStatus: "pending", isActive: true },
  { id: "1610dc50-7432-434a-ad47-5783507f3c87", name: "Maryland Agricultural Training Centre", county: "Maryland", accreditationStatus: "accredited", isActive: true },
];

const courseData = [
  { title: "Auto Mechanics Certificate", description: "Comprehensive training in vehicle maintenance, engine repair, and diagnostics.", providerId: "14d8b6c4-9dc9-4204-920b-7860d26b691e", durationWeeks: 24, cost: "35000", currency: "LRD", iscoCode: "7231", skillsCovered: ["Engine Repair", "Vehicle Diagnostics", "Brake Systems", "Electrical Systems"] },
  { title: "Electrical Installation", description: "Residential and commercial electrical wiring, safety standards, and power distribution.", providerId: "14d8b6c4-9dc9-4204-920b-7860d26b691e", durationWeeks: 20, cost: "30000", currency: "LRD", iscoCode: "7411", skillsCovered: ["Wiring", "Electrical Safety", "Power Distribution", "Circuit Design"] },
  { title: "Carpentry & Woodworking", description: "Furniture making, building construction, and woodworking techniques.", providerId: "14d8b6c4-9dc9-4204-920b-7860d26b691e", durationWeeks: 16, cost: "25000", currency: "LRD", iscoCode: "7115", skillsCovered: ["Furniture Making", "Construction", "Woodworking", "Blueprint Reading"] },
  { title: "Computer Literacy & IT Basics", description: "Introduction to computers, Microsoft Office, internet, and email for beginners.", providerId: "43dbe006-29f5-46a1-afc9-b331a9a16645", durationWeeks: 8, cost: "15000", currency: "LRD", iscoCode: "3512", skillsCovered: ["Microsoft Office", "Internet Skills", "Email", "Basic IT"] },
  { title: "Tailoring & Fashion Design", description: "Pattern cutting, garment construction, and fashion design basics.", providerId: "43dbe006-29f5-46a1-afc9-b331a9a16645", durationWeeks: 16, cost: "28000", currency: "LRD", iscoCode: "7531", skillsCovered: ["Sewing", "Pattern Cutting", "Fashion Design", "Garment Construction"] },
  { title: "Welding & Metal Fabrication", description: "Arc welding, MIG/TIG welding, and structural metalwork.", providerId: "9ea780ca-bf9d-4bc3-9748-7c154f3785f2", durationWeeks: 20, cost: "40000", currency: "LRD", iscoCode: "7212", skillsCovered: ["Arc Welding", "MIG Welding", "Metal Fabrication", "Safety"] },
  { title: "Plumbing & Pipe Fitting", description: "Water supply systems, drainage, pipe fitting, and sanitary installations.", providerId: "9ea780ca-bf9d-4bc3-9748-7c154f3785f2", durationWeeks: 16, cost: "30000", currency: "LRD", iscoCode: "7126", skillsCovered: ["Pipe Fitting", "Water Systems", "Drainage", "Sanitation"] },
  { title: "Mobile Phone Repair", description: "Smartphone diagnostics, screen replacement, software troubleshooting.", providerId: "4783f590-98b9-4e95-af40-272421921ee8", durationWeeks: 12, cost: "20000", currency: "LRD", iscoCode: "7421", skillsCovered: ["Phone Repair", "Diagnostics", "Screen Replacement", "Software"] },
  { title: "Solar Panel Installation", description: "Off-grid solar systems, panel installation, battery management, and maintenance.", providerId: "4783f590-98b9-4e95-af40-272421921ee8", durationWeeks: 12, cost: "350", currency: "USD", iscoCode: "7411", skillsCovered: ["Solar Installation", "Battery Systems", "Electrical", "Renewable Energy"] },
  { title: "Hospitality & Catering", description: "Hotel management, food preparation, customer service, and event catering.", providerId: "2ad191b8-f828-42cb-a55b-48e62bced671", durationWeeks: 16, cost: "25000", currency: "LRD", iscoCode: "5120", skillsCovered: ["Cooking", "Hotel Management", "Customer Service", "Food Safety"] },
  { title: "Cosmetology & Hairdressing", description: "Hair styling, skin care, manicure/pedicure, and salon management.", providerId: "2ad191b8-f828-42cb-a55b-48e62bced671", durationWeeks: 20, cost: "30000", currency: "LRD", iscoCode: "5141", skillsCovered: ["Hair Styling", "Skin Care", "Salon Management", "Customer Care"] },
  { title: "Agriculture & Farming", description: "Crop production, livestock management, and modern farming techniques.", providerId: "2db109c5-ddad-4e80-a739-b494e2db1642", durationWeeks: 24, cost: "20000", currency: "LRD", iscoCode: "6111", skillsCovered: ["Crop Production", "Livestock", "Farming Techniques", "Irrigation"] },
  { title: "Masonry & Building Construction", description: "Block laying, plastering, tiling, and construction project management.", providerId: "f157d310-912a-46f5-be63-d6940d07713f", durationWeeks: 20, cost: "28000", currency: "LRD", iscoCode: "7112", skillsCovered: ["Block Laying", "Plastering", "Tiling", "Construction Management"] },
  { title: "Fisheries & Aquaculture", description: "Fish farming, pond management, processing, and marketing.", providerId: "1610dc50-7432-434a-ad47-5783507f3c87", durationWeeks: 16, cost: "18000", currency: "LRD", iscoCode: "6221", skillsCovered: ["Fish Farming", "Pond Management", "Processing", "Marketing"] },
];

interface LessonData { title: string; content: string; durationMinutes: number; }
interface QuizData { question: string; options: string[]; correctIndex: number; explanation: string; }

const courseLessonData: Record<string, LessonData[]> = {
  "Auto Mechanics Certificate": [
    { title: "Fundamentals of Auto Mechanics", durationMinutes: 15, content: `Auto mechanics is a vital trade in Liberia, where vehicle maintenance and repair services are in high demand. Whether working on motorcycles, cars, trucks, or heavy equipment, understanding the basic principles of how engines and vehicles work is essential for a successful career in this field.

An internal combustion engine converts fuel into mechanical energy through a four-stroke cycle: intake, compression, power, and exhaust. During the intake stroke, the piston moves down and draws in a mixture of air and fuel. In the compression stroke, the piston moves up and compresses this mixture. The spark plug then ignites the compressed mixture in the power stroke, forcing the piston down. Finally, the exhaust stroke pushes the burned gases out of the cylinder.

The major systems of a vehicle include the engine, transmission, braking system, electrical system, cooling system, and suspension. Each system must work together for the vehicle to operate safely and efficiently. As a mechanic, you need to understand how these systems interact and be able to diagnose problems in any of them.

Safety is paramount in an auto workshop. Always wear appropriate personal protective equipment (PPE) including safety glasses, gloves, and steel-toed boots. Keep your work area clean and organized to prevent accidents. Never work under a vehicle supported only by a jack - always use jack stands. Be cautious with hot engines, moving parts, and flammable fluids.` },
    { title: "Engine Maintenance and Common Repairs", durationMinutes: 18, content: `Regular engine maintenance prevents costly breakdowns and extends the life of a vehicle. The most important maintenance tasks include changing engine oil, replacing filters, checking and replacing spark plugs, and maintaining the cooling system. In Liberia's hot climate, proper cooling system maintenance is especially critical.

Engine oil lubricates moving parts, reduces friction, and helps cool the engine. Oil should be changed every 5,000 to 7,500 kilometers, or as recommended by the manufacturer. To change oil, warm up the engine, drain the old oil from the drain plug, replace the oil filter, and add fresh oil of the correct grade (such as 10W-40 or 15W-40). Always check the oil level with the dipstick after adding new oil.

The cooling system prevents the engine from overheating. Check the coolant level regularly and inspect hoses for cracks or leaks. The radiator should be flushed and the coolant replaced every two years. In Liberia, overheating is a common problem due to high ambient temperatures, so ensure the radiator fan, thermostat, and water pump are functioning correctly.

Spark plugs ignite the fuel-air mixture in the engine cylinders. Worn or fouled spark plugs cause poor engine performance, rough idling, and difficulty starting. Remove spark plugs using a spark plug socket, inspect for wear or carbon deposits, and replace if necessary. Gap new spark plugs to the manufacturer's specification using a feeler gauge.` },
    { title: "Braking and Electrical Systems", durationMinutes: 16, content: `The braking system is the most critical safety system on any vehicle. Understanding how brakes work and being able to diagnose and repair brake problems can save lives. Most modern vehicles use disc brakes on the front wheels and either disc or drum brakes on the rear wheels.

Disc brakes work by pressing brake pads against a rotating disc (rotor) attached to the wheel. When you press the brake pedal, hydraulic fluid pushes pistons in the brake caliper, which squeeze the pads against the rotor. Signs that brakes need service include squealing noises, vibration when braking, the vehicle pulling to one side, or a soft brake pedal. Always replace brake pads in pairs (both sides of the same axle) and check the rotors for wear or warping.

The vehicle's electrical system powers everything from the starter motor to the headlights. The battery provides electrical energy to start the engine, and the alternator recharges the battery while the engine is running. Common electrical problems include dead batteries, faulty alternators, blown fuses, and corroded connections.

To test a battery, use a multimeter set to DC voltage. A fully charged battery should read about 12.6 volts with the engine off. With the engine running, the reading should be 13.5 to 14.5 volts, indicating the alternator is charging properly. Clean corroded battery terminals with a wire brush and baking soda solution, and ensure connections are tight.` },
  ],
  "Electrical Installation": [
    { title: "Electrical Fundamentals and Safety", durationMinutes: 15, content: `Electricity is essential to modern life in Liberia, powering homes, businesses, hospitals, and schools. As an electrician, you will install, maintain, and repair electrical systems that people depend on daily. Understanding the fundamentals of electricity and practicing strict safety protocols is the foundation of this profession.

Electricity flows through conductors (usually copper or aluminum wire) in a circuit. The three key measurements are voltage (electrical pressure, measured in volts), current (flow of electricity, measured in amperes), and resistance (opposition to flow, measured in ohms). These are related by Ohm's Law: Voltage = Current x Resistance (V = I x R).

Electrical safety cannot be overstated. Electrocution is a leading cause of workplace death. Always de-energize circuits before working on them and use a voltage tester to confirm power is off. Use insulated tools, wear rubber-soled shoes, and never work on electrical systems in wet conditions. Learn the color coding of wires in Liberia: typically brown or red for live, blue for neutral, and green/yellow for earth.

Understanding circuit types is essential. Series circuits have components connected end-to-end, so if one component fails, the entire circuit stops working. Parallel circuits have components connected side-by-side, allowing each to operate independently. Most household wiring uses parallel circuits so that individual lights and outlets can function independently.` },
    { title: "Residential Wiring and Installation", durationMinutes: 18, content: `Residential electrical installation involves planning and installing the complete wiring system for a home. This includes the main distribution board (consumer unit), circuit breakers, wiring for lighting, power outlets, and dedicated circuits for heavy appliances like air conditioners and water heaters.

The distribution board is the heart of a home's electrical system. It receives power from the utility supply and distributes it to individual circuits through circuit breakers. Each circuit breaker protects a specific circuit by automatically disconnecting power if the current exceeds a safe level. A residual current device (RCD) provides additional protection by detecting earth leakage faults that could cause electrocution.

When wiring a home, plan the layout carefully. Consider the placement of outlets, switches, and light fixtures for each room. Bedrooms typically need at least two double outlets and a ceiling light. Kitchens require more outlets for appliances and should have dedicated circuits for refrigerators and stoves. Bathrooms need special attention due to the presence of water.

Cable sizing is critical for safety and performance. Using wire that is too small for the load causes overheating and fire risk. Common residential cable sizes include 1.5mm² for lighting circuits and 2.5mm² for power outlet circuits. Larger cables (4mm² or 6mm²) are used for high-power appliances. Always follow local electrical codes and standards when selecting cable sizes.` },
    { title: "Power Distribution and Troubleshooting", durationMinutes: 16, content: `Power distribution systems carry electricity from generation sources to end users. In Liberia, the Liberia Electricity Corporation (LEC) manages the national grid, though many areas rely on generators or solar power. Understanding how power is distributed helps electricians work safely and effectively with both grid and off-grid systems.

Three-phase power is used for commercial and industrial applications, providing higher power capacity. Single-phase power, derived from one phase of the three-phase system, is used for most residential applications. Understanding the difference between single-phase (230V) and three-phase (400V) systems is essential for any electrician working in Liberia.

Troubleshooting electrical problems requires a systematic approach. Start by gathering information: what stopped working, when did it happen, and were there any unusual events? Then use testing equipment to isolate the problem. A multimeter is the electrician's most important diagnostic tool, capable of measuring voltage, current, resistance, and continuity.

Common electrical faults include open circuits (broken wire or loose connection), short circuits (unintended connection between live and neutral), earth faults (current leaking to ground), and overloads (too many devices on one circuit). Each type of fault produces different symptoms and requires different diagnostic approaches. Always document your findings and the repairs made for future reference.` },
  ],
  "Carpentry & Woodworking": [
    { title: "Introduction to Carpentry and Wood Types", durationMinutes: 15, content: `Carpentry is one of the oldest and most respected trades in Liberia. From building homes and schools to crafting furniture and market stalls, skilled carpenters are essential to every community. This course will teach you the fundamental skills needed to work with wood safely and effectively.

Understanding different types of wood is crucial for any carpenter. In Liberia, commonly used hardwoods include mahogany, iroko, and ekki (also known as African ironwood). These dense woods are excellent for structural work and furniture but require sharp tools and more effort to work with. Softwoods, while less common locally, are sometimes imported and are easier to cut and shape.

Wood has a natural grain pattern that affects how it behaves when cut, shaped, and finished. Always work with the grain when planing or sanding to achieve smooth results. Working against the grain causes tear-out, leaving rough and uneven surfaces. Understanding grain direction also helps you predict how wood will respond to changes in humidity, which is particularly important in Liberia's tropical climate.

Moisture content significantly affects wood quality. Freshly cut wood (green wood) contains a high percentage of water and will shrink as it dries, potentially causing warping, cracking, and joint failure. Properly seasoned wood should have a moisture content of 12-15% for indoor furniture. Air-drying wood by stacking it with spacers in a covered area is the most accessible method in Liberia, though it may take several months.` },
    { title: "Essential Hand Tools and Joinery Techniques", durationMinutes: 20, content: `A carpenter is only as good as their tools. Mastering hand tools is the foundation of carpentry, and even carpenters who use power tools regularly need strong hand tool skills. The essential hand tools every carpenter needs include a claw hammer, hand saw (crosscut and rip), chisels of various sizes, a block plane, measuring tape, try square, marking gauge, and a spirit level.

Accurate measurement and marking are the keys to quality carpentry. The carpenter's saying "measure twice, cut once" exists because cutting errors waste material and time. Use a steel measuring tape for lengths, a try square to mark 90-degree angles, and a marking gauge for consistent parallel lines. Always mark your cut line clearly with a sharp pencil or marking knife.

Joinery is the art of connecting pieces of wood together. The most common joints used in Liberian carpentry include butt joints (the simplest, where two pieces meet end-to-end), lap joints (where pieces overlap), mortise and tenon joints (a strong joint where a projection fits into a hole), and dovetail joints (interlocking wedge-shaped cuts used for drawers and boxes).

The mortise and tenon joint is considered the workhorse of woodworking. To create this joint, cut a rectangular hole (mortise) in one piece using a chisel, and shape a matching projection (tenon) on the connecting piece. The tenon should fit snugly into the mortise. When glued, this joint is incredibly strong and can withstand significant stress, making it ideal for door frames, table legs, and structural connections.` },
    { title: "Furniture Making and Finishing", durationMinutes: 17, content: `Building furniture combines all the carpentry skills you have learned: measuring, cutting, joinery, and finishing. Whether you are making a simple bench or an elaborate cabinet, the process follows the same basic steps: design, material selection, cutting, assembly, and finishing.

Start every project with a clear plan. Sketch your design with dimensions, noting all joints and connections. Calculate the amount of wood required and add 10-15% extra for waste and mistakes. Create a cutting list that details every piece needed with its exact dimensions.

Assembly requires patience and precision. Dry-fit all pieces before applying glue to check that everything fits correctly. Use clamps to hold pieces together while glue dries. For large projects, assemble in stages rather than trying to put everything together at once. Check for squareness at every stage using a try square or by measuring diagonals.

Wood finishing protects the wood and enhances its appearance. Common finishing options include varnish (provides a hard, durable surface), lacquer (dries quickly and gives a smooth finish), oil finishes (penetrate the wood and highlight the grain), and paint (provides color and protection). In Liberia's humid climate, a good finish is essential to prevent moisture damage, insect attack, and fungal growth.` },
  ],
  "Computer Literacy & IT Basics": [
    { title: "Introduction to Computers", durationMinutes: 15, content: `Computers have become essential tools in workplaces, schools, and daily life in Liberia. Understanding how to use a computer opens doors to better job opportunities, improved communication, and access to information. This lesson introduces you to the basic components of a computer and how they work together.

A computer system consists of hardware (physical components) and software (programs and applications). The main hardware components include the Central Processing Unit (CPU), which is the brain of the computer; Random Access Memory (RAM), which temporarily stores data being used; the hard drive or solid-state drive, which permanently stores your files; the monitor, which displays information; and input devices like the keyboard and mouse.

The operating system is the most important software on a computer. It manages all hardware and software resources. The most common operating systems are Microsoft Windows, macOS (for Apple computers), and Linux. Most computers in Liberian offices and schools run Windows, which provides a graphical user interface with icons, windows, and menus.

Basic computer operations include turning the computer on and off properly (always shut down through the Start menu rather than pressing the power button), using the mouse to click, double-click, and right-click, typing with the keyboard, and navigating the desktop. Practice these skills until they become second nature, as they form the foundation for everything else you will learn.` },
    { title: "Microsoft Office Essentials", durationMinutes: 18, content: `Microsoft Office is the most widely used suite of productivity applications in Liberian workplaces. The three core applications are Microsoft Word (for documents), Microsoft Excel (for spreadsheets), and Microsoft PowerPoint (for presentations). Mastering these tools will make you productive in almost any office environment.

Microsoft Word is used for creating letters, reports, resumes, and other text documents. Key features include text formatting (bold, italic, font size and style), paragraph alignment, inserting images and tables, spell checking, and page layout options. To create a new document, open Word and start typing. Save your work regularly using Ctrl+S or the Save button.

Microsoft Excel is a powerful spreadsheet application used for organizing data, performing calculations, and creating charts. Data is organized in rows and columns, with each intersection called a cell. Cells can contain text, numbers, or formulas. Basic formulas include SUM (adds numbers), AVERAGE (calculates the mean), and COUNT (counts cells with numbers). To create a formula, start by typing = in a cell.

Microsoft PowerPoint is used for creating visual presentations. Each presentation consists of slides that can contain text, images, charts, and other visual elements. When creating a presentation, use clear and concise text, relevant images, and a consistent design. The rule of thumb is no more than 6 bullet points per slide, with no more than 6 words per bullet point.` },
    { title: "Internet, Email, and Digital Safety", durationMinutes: 16, content: `The internet connects computers worldwide, providing access to information, communication, and services. In Liberia, internet access is growing through mobile phones and cyber cafes. Understanding how to use the internet safely and effectively is an essential skill for the modern workplace.

Web browsers like Google Chrome, Mozilla Firefox, and Microsoft Edge are used to access websites. To visit a website, type its address (URL) in the address bar and press Enter. Use search engines like Google to find information by typing keywords related to what you are looking for. Evaluate search results critically, as not all information online is accurate or trustworthy.

Email (electronic mail) is the primary communication tool in professional settings. Popular email services include Gmail, Yahoo Mail, and Outlook. When writing a professional email, include a clear subject line, a proper greeting, concise and well-organized content, and a professional closing. Always proofread your emails before sending them.

Digital safety is crucial in today's connected world. Create strong passwords using a mix of letters, numbers, and symbols, and never share them with others. Be cautious of phishing emails that try to trick you into revealing personal information. Keep your software updated to protect against security vulnerabilities. Back up your important files regularly to prevent data loss.` },
  ],
  "Tailoring & Fashion Design": [
    { title: "Introduction to Tailoring and Sewing Fundamentals", durationMinutes: 16, content: `Tailoring is a highly valued skill in Liberia, where custom-made clothing is preferred for many occasions including weddings, church services, and cultural celebrations. A skilled tailor can build a thriving business serving their community while expressing creativity through fabric and design.

Understanding fabrics is the first step in tailoring. Common fabrics used in Liberia include cotton (cool and comfortable for everyday wear), lace (popular for formal occasions), ankara/African print (bold patterns for traditional and modern styles), and silk or satin (for special occasions). Each fabric behaves differently when cut and sewn, so learning their characteristics is essential.

The sewing machine is a tailor's most important tool. Basic sewing machines use a straight stitch and a zigzag stitch. Learn to thread the machine properly, wind the bobbin, and adjust the tension and stitch length. Practice sewing straight lines and curves on scrap fabric before working on actual garments. Keep your machine clean and oiled for smooth operation.

Hand sewing skills are equally important. Learn basic hand stitches including the running stitch (for basting and gathering), backstitch (for strong seams), slip stitch (for invisible hems), and buttonhole stitch. Good hand sewing is essential for finishing details like attaching buttons, creating buttonholes, and making repairs.` },
    { title: "Pattern Making and Fabric Cutting", durationMinutes: 18, content: `Pattern making is the art of creating templates for cutting fabric pieces that will be sewn together into a garment. Accurate patterns are essential for well-fitting clothing. A basic pattern is developed from body measurements and can be modified to create different styles and designs.

Taking accurate body measurements is the foundation of good pattern making. Essential measurements include chest/bust circumference, waist circumference, hip circumference, shoulder width, arm length, and desired garment length. Always use a flexible measuring tape and measure over light clothing. Record all measurements carefully and double-check them before cutting.

Draft patterns on pattern paper or brown craft paper using your measurements. Start with basic blocks (also called slopers) for the bodice, skirt, and sleeve. These basic shapes can be modified to create endless variations. Add seam allowances (usually 1.5cm) around all pattern pieces before cutting.

Fabric cutting requires precision and care. Lay your fabric on a large, flat surface. Position pattern pieces according to the grain line, ensuring they are aligned with the fabric's lengthwise grain for proper drape and fit. Pin patterns securely to the fabric and cut with sharp fabric scissors, following the pattern edges exactly. Mark important points like darts, notches, and fold lines before removing the pattern.` },
    { title: "Garment Construction and Finishing", durationMinutes: 17, content: `Garment construction is the process of assembling cut fabric pieces into a finished garment. Following a logical sequence of steps ensures professional results. The general order is: prepare pieces, join main seams, add details, attach sleeves and collars, and finish edges.

Before sewing, prepare all pieces by transferring pattern markings to the fabric. Staystitch curved edges like necklines to prevent stretching. Interface areas that need structure, such as collars, cuffs, and button plackets. Interfacing is a special fabric that adds stiffness and is applied with heat.

Seam construction is the backbone of garment making. Pin pieces right sides together, matching notches and markings. Sew with the appropriate seam allowance, backstitching at the beginning and end of each seam for strength. Press seams open or to one side after sewing, as pressing is what gives garments a professional look. Never skip pressing - it is the difference between amateur and professional work.

Finishing techniques give garments a polished, professional appearance. Hem edges by folding and stitching, or use a blind hem stitch for invisible finishes. Add closures such as zippers, buttons, hooks, or snaps. Topstitching adds a decorative and functional finish to seams and edges. Final pressing ensures the garment looks crisp and ready to wear.` },
  ],
  "Welding & Metal Fabrication": [
    { title: "Introduction to Welding and Safety", durationMinutes: 15, content: `Welding is the process of joining metals by heating them to their melting point and fusing them together. In Liberia, welding skills are in high demand for construction, manufacturing, vehicle repair, and fabrication of gates, furniture, and structural components. A skilled welder can find employment in many sectors or start their own business.

Safety is the most critical aspect of welding. The welding process produces intense heat, bright light, harmful fumes, and ultraviolet radiation. Always wear proper protective equipment: a welding helmet with the correct shade lens (shade 10-13 for arc welding), fire-resistant clothing, leather gloves, and safety boots. Work in well-ventilated areas to avoid inhaling toxic fumes.

The three most common welding processes are Shielded Metal Arc Welding (SMAW, also called stick welding), Metal Inert Gas welding (MIG), and Tungsten Inert Gas welding (TIG). Stick welding is the most common method in Liberia because the equipment is relatively inexpensive, portable, and works well outdoors. MIG welding is faster and easier to learn, while TIG welding produces the highest quality welds.

Understanding metals is essential for welding. Different metals require different welding techniques, filler materials, and temperatures. The most commonly welded metals in Liberia are mild steel (used in construction and fabrication), stainless steel (used in food equipment and decorative work), and aluminum (used in some vehicle parts and lightweight structures).` },
    { title: "Arc Welding Techniques and Practice", durationMinutes: 18, content: `Shielded Metal Arc Welding (SMAW), commonly called stick welding, uses an electric arc between a coated electrode (welding rod) and the workpiece to create a weld. The electrode coating creates a gas shield and slag that protect the molten weld pool from atmospheric contamination.

Setting up for stick welding involves connecting the welding machine to a power source, attaching the ground clamp to the workpiece or welding table, and inserting an electrode into the electrode holder. Set the amperage according to the electrode size and material thickness. For example, a 3.2mm (1/8 inch) electrode typically requires 80-120 amps.

Striking an arc is the first skill to master. Hold the electrode at about a 15-20 degree angle from vertical and either tap it on the metal surface or use a scratching motion like striking a match. Once the arc is established, maintain a consistent arc length equal to the diameter of the electrode. Too long an arc causes spattering and porosity, while too short an arc may cause the electrode to stick.

Practice basic weld beads on flat plate before attempting joints. Run straight beads across practice plates, maintaining consistent travel speed, arc length, and electrode angle. A good weld bead should be uniform in width and height, with consistent ripple patterns. Practice until you can produce clean, consistent beads every time before moving on to different joint types.` },
    { title: "Joint Types and Metal Fabrication", durationMinutes: 16, content: `Welded joints connect metal pieces in various configurations depending on the application. The five basic joint types are butt joints (pieces edge-to-edge), lap joints (pieces overlapping), T-joints (one piece perpendicular to another), corner joints (pieces at 90 degrees forming a corner), and edge joints (pieces parallel with edges aligned).

Each joint type requires specific preparation and welding technique. Butt joints may need a gap or bevel depending on material thickness. For material over 6mm thick, create a V-groove to ensure full penetration. Lap joints are common in sheet metal work and are relatively easy to weld. T-joints require fillet welds on one or both sides.

Metal fabrication combines cutting, bending, and welding to create finished products. Common fabrication projects in Liberia include security gates, window frames, furniture, and structural supports. The fabrication process starts with reading a drawing or plan, calculating material requirements, cutting pieces to size, fitting them together, tack welding to hold position, and completing the full welds.

Quality control is essential in welding. Visual inspection checks for surface defects like cracks, porosity (small holes), undercut (grooves along the weld edges), and incomplete fusion. A good weld should have consistent width, smooth transitions to the base metal, and no visible defects. Practice consistently and seek feedback from experienced welders to improve your skills.` },
  ],
  "Plumbing & Pipe Fitting": [
    { title: "Introduction to Plumbing Systems", durationMinutes: 15, content: `Plumbing is essential for public health and comfort, providing clean water supply and safe wastewater removal. In Liberia, skilled plumbers are needed for residential, commercial, and institutional projects. Understanding plumbing fundamentals will prepare you for a rewarding career in this essential trade.

A plumbing system consists of two main subsystems: the water supply system (bringing clean water in) and the drainage system (taking wastewater out). The water supply system operates under pressure, either from a municipal water main, a water tank elevated above the building, or a pump. The drainage system relies on gravity to move wastewater away from fixtures to a septic tank or sewer.

Common plumbing materials include PVC (polyvinyl chloride) pipes for drainage and cold water, CPVC or copper pipes for hot water, galvanized steel pipes for older installations, and PPR (polypropylene) pipes which are becoming popular in Liberia. Each material has specific joining methods: PVC uses solvent cement (glue), copper uses soldering, and PPR uses heat fusion.

Plumbing tools include pipe cutters, wrenches (adjustable, pipe, and basin wrenches), pliers, tape measures, levels, and threading equipment. A plumber's tool kit also includes materials like Teflon tape (PTFE tape) for sealing threaded connections, pipe cement and primer for PVC joints, and various fittings including elbows, tees, couplings, and reducers.` },
    { title: "Water Supply and Fixture Installation", durationMinutes: 18, content: `The water supply system delivers clean water to fixtures throughout a building. Planning a water supply system requires calculating the demand (how much water is needed), determining pipe sizes (to ensure adequate flow and pressure), and routing pipes efficiently from the source to each fixture.

Pipe sizing depends on the flow rate needed and the length of the pipe run. Larger pipes carry more water with less pressure loss. Main supply lines are typically 3/4 inch or 1 inch in diameter, while branch lines to individual fixtures are usually 1/2 inch. Always size pipes according to the number of fixtures they serve and the distance from the water source.

Installing plumbing fixtures requires precision and attention to detail. Common fixtures include sinks, toilets, showers, and water heaters. When installing a sink, mount it securely, connect the water supply lines (hot on the left, cold on the right), install the drain assembly with a proper P-trap, and check all connections for leaks.

Toilet installation involves setting the closet flange at the correct height, placing a wax ring seal, carefully positioning the toilet, bolting it down evenly, and connecting the water supply. The toilet must be level and the seal must be watertight to prevent leaks and odor. After installation, flush several times and check all connections for any signs of leakage.` },
    { title: "Drainage Systems and Troubleshooting", durationMinutes: 15, content: `Drainage systems remove wastewater from fixtures and carry it to a septic system or sewer. Unlike water supply systems that operate under pressure, drainage relies on gravity. Therefore, all drain pipes must be installed with a proper slope (fall) to ensure water flows downhill consistently.

The standard slope for drain pipes is 1/4 inch per foot (approximately 2% grade). Too little slope causes water to move slowly and solids to settle, leading to blockages. Too much slope causes water to flow too fast, leaving solids behind, which also causes blockages. Use a level and measuring tools to ensure proper slope during installation.

Every fixture drain must include a trap (usually a P-trap) that holds a small amount of water to prevent sewer gases from entering the building. The drainage system also requires venting - pipes that extend to the roof to allow air into the system. Without proper venting, drains gurgle, flow slowly, and traps can be siphoned dry, allowing harmful gases inside.

Troubleshooting plumbing problems requires systematic diagnosis. For blocked drains, start with a plunger, then try a drain snake (auger). For persistent blockages, you may need to disassemble the trap or use specialized equipment. Common causes of slow drains include hair and soap buildup, grease accumulation, foreign objects, and tree root intrusion in underground pipes.` },
  ],
  "Mobile Phone Repair": [
    { title: "Smartphone Components and Diagnostics", durationMinutes: 15, content: `Mobile phone repair is one of the fastest-growing trades in Liberia, driven by the widespread adoption of smartphones. With millions of mobile phone users in the country, repair technicians are in constant demand. Understanding smartphone components and diagnostic techniques is the foundation of this trade.

A smartphone consists of several key components: the display assembly (LCD/OLED screen and digitizer for touch), the motherboard (main circuit board with processor, memory, and connectivity chips), the battery, cameras (front and rear), speakers and microphone, charging port, and various sensors (proximity, accelerometer, gyroscope).

Diagnostic skills are essential for efficient repair. When a customer brings in a phone, start by gathering information about the problem. Then perform a systematic check: test the display, touch functionality, audio (speakers and microphone), cameras, charging, Wi-Fi, Bluetooth, and cellular connectivity. Document your findings before beginning any repair.

Essential tools for phone repair include precision screwdriver sets (Phillips, Pentalobe, tri-wing), plastic prying tools (spudgers), suction cups for screen removal, tweezers, heat guns or heat mats for softening adhesive, magnifying glass or microscope for board-level work, and a multimeter for electrical testing. Invest in quality tools as they make your work easier and reduce the risk of damage.` },
    { title: "Screen Replacement and Battery Service", durationMinutes: 18, content: `Screen replacement is the most common smartphone repair. Cracked or damaged screens account for the majority of repair requests. The process varies by phone model, but the general steps are similar: heat the screen to soften the adhesive, carefully separate the screen from the frame, disconnect ribbon cables, and install the new screen.

Before starting any repair, back up the customer's data if possible and power off the device. Remove the SIM card and any memory cards. Work on a clean, organized surface with an anti-static mat. Use a parts organizer or magnetic mat to keep track of the tiny screws, as different screws often have different lengths and must go back in their original positions.

For screen replacement, heat the edges of the phone with a heat gun set to about 80 degrees Celsius. Apply a suction cup near the bottom edge and gently pull while inserting a thin plastic pry tool into the gap. Slide the tool around the edges to separate the adhesive. Once open, identify and carefully disconnect the battery first, then disconnect the screen cables. Remove the old screen and transfer any components (home button, earpiece, camera brackets) to the new screen.

Battery replacement is another common service. Smartphone batteries degrade over time, holding less charge and potentially swelling. Signs of a failing battery include rapid battery drain, the phone shutting off at 20-30% charge, physical swelling (screen pushing outward), and overheating during charging. Replace batteries with quality parts from reputable suppliers to ensure safety and performance.` },
    { title: "Software Troubleshooting and Business Skills", durationMinutes: 15, content: `Many phone problems are software-related rather than hardware issues. Common software problems include phones freezing or crashing, apps not working properly, slow performance, storage full warnings, and network connectivity issues. Understanding how to diagnose and fix software problems is essential for a complete phone repair service.

For Android devices, common software fixes include clearing app caches and data, performing a factory reset (with customer permission and data backup), updating the operating system and apps, and removing malware or unwanted apps. For iPhones, solutions include force restarting, resetting settings, restoring through iTunes or Finder, and updating iOS.

Data recovery is a valuable service that many customers need. When a phone is damaged or malfunctioning, customers often need their photos, contacts, and messages recovered before the phone is repaired or replaced. Learn to use data recovery software and techniques for both Android and iOS devices. Always get written permission before accessing a customer's data.

Building a successful phone repair business requires both technical skills and business knowledge. Keep accurate records of all repairs, maintain an inventory of common parts, set fair prices that cover your costs and provide a reasonable profit, and always provide receipts and warranty information. Building a reputation for honest, quality work is the best marketing strategy in Liberia's close-knit communities.` },
  ],
  "Solar Panel Installation": [
    { title: "Solar Energy Fundamentals", durationMinutes: 15, content: `Solar energy is transforming how Liberians access electricity. With abundant sunshine throughout the year and limited grid coverage in rural areas, solar power systems provide a reliable and sustainable solution for homes, businesses, schools, and health facilities. As a solar installer, you will play a vital role in bringing clean energy to communities across Liberia.

Solar photovoltaic (PV) panels convert sunlight directly into electricity. Each panel is made up of solar cells, typically silicon-based, that generate a small amount of electricity when struck by light. When many cells are connected together in a panel, and multiple panels are connected in a system, they can produce enough electricity to power a home or business.

A complete off-grid solar system consists of four main components: solar panels (to generate electricity), a charge controller (to regulate charging), batteries (to store energy for nighttime use), and an inverter (to convert DC battery power to AC power for standard appliances). Each component must be properly sized to match the system's energy needs.

Understanding solar radiation is important for system design. Liberia receives an average of 4.5-5.5 peak sun hours per day, which is excellent for solar energy production. Peak sun hours represent the equivalent number of hours when solar radiation averages 1,000 watts per square meter. This figure is used to calculate how much energy your solar panels will produce daily.` },
    { title: "System Design and Panel Installation", durationMinutes: 18, content: `Designing a solar system starts with calculating the energy needs of the home or building. List all electrical appliances, their power consumption (in watts), and how many hours each is used daily. Multiply watts by hours to get watt-hours per day. Add all appliances together to find the total daily energy consumption. Add 25% for system losses.

Sizing the solar array: Divide the total daily energy consumption by the peak sun hours for your location (typically 4.5-5 for Liberia). This gives you the required panel capacity in watts. For example, if daily consumption is 2,000Wh and you have 5 peak sun hours, you need 400W of panels. It's good practice to add 20% extra capacity for cloudy days and panel degradation.

Battery sizing for off-grid systems: Batteries store energy for nighttime and cloudy day use. Calculate the battery capacity needed by dividing daily consumption by the battery voltage (typically 12V or 24V). For lead-acid batteries, only discharge to 50% to extend battery life, so double the calculated capacity. Lithium batteries can be discharged to 80-90%.

Panel installation requires careful attention to orientation and mounting. In Liberia, panels should face south (toward the equator) and be tilted at approximately 6-8 degrees (close to Liberia's latitude). Mount panels securely on rooftops or ground-mounted frames using appropriate brackets. Ensure the mounting structure can withstand heavy rain and strong winds during the rainy season.` },
    { title: "Electrical Connections and Maintenance", durationMinutes: 16, content: `Proper electrical connections are critical for the safety and efficiency of a solar system. All wiring must be sized correctly for the current flowing through it, and all connections must be secure and weatherproof. Use solar-rated cables (UV resistant) for outdoor wiring and proper connectors designed for solar installations.

The charge controller regulates the flow of electricity from the panels to the batteries, preventing overcharging. There are two types: PWM (Pulse Width Modulation) controllers, which are simpler and less expensive, and MPPT (Maximum Power Point Tracking) controllers, which are more efficient and extract up to 30% more energy from the panels. For systems over 200W, MPPT controllers are recommended.

The inverter converts DC (direct current) from batteries to AC (alternating current) for standard household appliances. Choose an inverter rated for your maximum load with some headroom. Pure sine wave inverters are preferred over modified sine wave inverters as they work with all appliances including sensitive electronics. Install the inverter in a cool, dry, and well-ventilated location.

Regular maintenance ensures long system life and optimal performance. Clean solar panels monthly with water and a soft cloth to remove dust and bird droppings. Check battery water levels (for flooded lead-acid batteries) monthly and top up with distilled water. Inspect all connections for corrosion or looseness quarterly. Monitor system performance regularly to detect problems early.` },
  ],
  "Hospitality & Catering": [
    { title: "Introduction to Hospitality Industry", durationMinutes: 15, content: `The hospitality industry in Liberia is growing rapidly with increasing tourism, business travel, and a vibrant local dining culture. Hotels, restaurants, catering services, and event venues provide numerous employment opportunities for trained professionals. This course will equip you with the fundamental skills needed to excel in this exciting industry.

Customer service is the cornerstone of hospitality. Every interaction with a guest creates an impression of your establishment. Greet guests warmly, make eye contact, and use their name when possible. Listen carefully to their needs and respond promptly. Handle complaints calmly and professionally, viewing them as opportunities to demonstrate your commitment to guest satisfaction.

Understanding the organizational structure of a hospitality business helps you work effectively. A hotel typically includes front office (reception), housekeeping, food and beverage, maintenance, and management departments. A restaurant includes the front of house (dining room, bar) and back of house (kitchen, storage). Each department plays a vital role in delivering a seamless guest experience.

Personal hygiene and professional appearance are non-negotiable in hospitality. Always maintain clean hands, neat hair, clean uniforms, and minimal jewelry. In food service, additional hygiene requirements include wearing hair nets or caps, no nail polish, covering any cuts or wounds, and washing hands frequently, especially after handling raw food, using the restroom, or touching your face.` },
    { title: "Food Preparation and Kitchen Safety", durationMinutes: 18, content: `Food preparation is at the heart of hospitality and catering. Whether preparing a simple meal or catering a large event, understanding basic cooking techniques, food safety principles, and kitchen organization is essential. In Liberia, cuisine reflects a rich blend of traditional West African flavors and international influences.

Kitchen safety prevents injuries and foodborne illness. The key principles include proper hand washing (20 seconds with soap and warm water), keeping raw and cooked foods separate to prevent cross-contamination, cooking food to safe internal temperatures, and maintaining proper food storage temperatures (cold food below 5°C, hot food above 60°C).

Basic cooking methods every hospitality professional should master include boiling (cooking in water at 100°C), frying (cooking in oil at high temperature), grilling (cooking over direct heat), baking (cooking in an enclosed oven), steaming (cooking with steam from boiling water), and sautéing (cooking quickly in a small amount of oil). Each method affects the flavor, texture, and nutritional value of food differently.

Knife skills are fundamental to efficient food preparation. The basic cuts include dice (small cubes), julienne (thin strips), chiffonade (thin ribbons of leafy vegetables), and brunoise (very fine dice). Always use a sharp knife (dull knives cause more accidents), cut on a stable cutting board, and curl your fingers under when holding food to protect your fingertips.` },
    { title: "Event Catering and Menu Planning", durationMinutes: 16, content: `Event catering is a profitable segment of the hospitality industry in Liberia, with demand for services at weddings, corporate events, government functions, and community celebrations. Successful catering requires careful planning, efficient execution, and attention to detail.

Menu planning starts with understanding the event: type of event, number of guests, budget, dietary requirements, and venue facilities. Consider seasonal availability of ingredients in Liberia, as this affects both cost and quality. A balanced menu offers variety in flavors, textures, and colors. Include options for guests with dietary restrictions such as vegetarian, halal, or allergy-related needs.

Quantity planning is critical for controlling costs and preventing waste. Calculate portion sizes for each dish and multiply by the number of guests. Add 10-15% extra for unexpected guests and second servings. For buffet service, plan for guests to sample multiple items with smaller portions of each. Keep detailed records of quantities prepared versus consumed to improve future planning.

Event execution requires coordination and teamwork. Create a detailed timeline that covers food preparation, transport, setup, service, and cleanup. Assign specific responsibilities to each team member. Prepare as much as possible in advance. Ensure food is transported at safe temperatures and arrive at the venue with enough time for setup. After the event, seek feedback from the client to improve your service.` },
  ],
  "Cosmetology & Hairdressing": [
    { title: "Foundations of Cosmetology", durationMinutes: 15, content: `Cosmetology encompasses hair care, skin care, nail care, and overall beauty enhancement. In Liberia, beauty professionals are highly respected and can build thriving businesses serving their communities. This course provides the foundation knowledge and skills needed to start a successful career in cosmetology.

Understanding hair structure and types is essential for any cosmetologist. Hair grows from follicles in the scalp and consists of three layers: the cuticle (outer protective layer), cortex (gives hair strength and color), and medulla (inner core). African hair textures range from tightly coiled (Type 4) to wavy and curly patterns. Each texture requires different care and styling techniques.

Scalp health directly affects hair health. A healthy scalp provides the foundation for strong, beautiful hair. Common scalp conditions include dandruff (caused by a fungus called Malassezia), dry scalp (often due to weather or harsh products), and scalp irritation from chemical treatments. Regular scalp massage increases blood circulation and promotes hair growth.

Hygiene and sanitation are critical in a salon environment. All tools must be cleaned and disinfected between clients to prevent the spread of infections. Combs, brushes, and clips should be washed with soap and water, then disinfected with a hospital-grade disinfectant. Scissors and clippers should be cleaned and oiled regularly. Use fresh towels and capes for each client.` },
    { title: "Hair Styling and Chemical Treatments", durationMinutes: 18, content: `Hair styling is both an art and a science. Basic styling techniques that every cosmetologist should master include blow-drying with a round brush for volume and smoothness, flat ironing for straight styles, curling with rollers or curling irons, braiding (cornrows, box braids, Ghana braids), and twist styles (two-strand twists, flat twists).

Braiding is one of the most popular and culturally significant hair services in Liberia. Mastering various braiding techniques is essential for success. Cornrows involve braiding close to the scalp in rows, while box braids section the hair into squares and braid extensions into each section. Feed-in braids create a natural, seamless look by gradually adding extension hair as you braid.

Chemical treatments alter the hair's structure and require advanced knowledge and care. Relaxers permanently straighten curly hair by breaking and reforming chemical bonds. The two types are lye (sodium hydroxide) and no-lye (calcium hydroxide) relaxers. Always perform a strand test before applying relaxers, follow manufacturer instructions exactly, and never apply relaxer to previously relaxed hair.

Hair coloring adds dimension and personality to any style. Temporary colors wash out in one shampoo, semi-permanent colors last 4-6 weeks, and permanent colors last until the hair grows out. When coloring African hair, consider the existing hair color, desired result, and hair condition. Damaged or chemically treated hair may react differently to color than healthy hair.` },
    { title: "Skin Care and Salon Management", durationMinutes: 16, content: `Skin care is an important part of cosmetology that goes beyond basic beauty treatments. Understanding skin types, common conditions, and proper care techniques allows you to offer comprehensive beauty services. The skin is the body's largest organ and requires proper care to look and function its best.

There are five basic skin types: normal (balanced), oily (excess sebum production), dry (lacking moisture), combination (oily in some areas, dry in others), and sensitive (easily irritated). Each type requires different products and care routines. In Liberia's tropical climate, oily and combination skin are common due to heat and humidity.

A basic facial treatment includes cleansing (removing dirt and makeup), toning (balancing skin pH), exfoliating (removing dead skin cells), applying a treatment mask (addressing specific skin concerns), and moisturizing (hydrating and protecting the skin). Always perform a skin analysis before treatment and ask about any allergies or sensitivities.

Salon management skills are essential for building a successful beauty business. Key aspects include choosing a good location with visibility and foot traffic, creating a clean and inviting atmosphere, setting competitive prices that cover your costs and provide profit, managing inventory and supplies, keeping accurate financial records, and building a loyal clientele through excellent service and word-of-mouth referrals.` },
  ],
  "Agriculture & Farming": [
    { title: "Introduction to Agriculture in Liberia", durationMinutes: 15, content: `Agriculture is the backbone of Liberia's economy, employing over 70% of the population. The country's tropical climate, with its distinct rainy and dry seasons, creates ideal conditions for growing a wide variety of crops including rice, cassava, palm oil, rubber, and cocoa. Understanding the fundamentals of farming is essential for anyone looking to contribute to Liberia's food security and economic development.

In this lesson, you will learn about the different types of farming practiced in Liberia, from subsistence farming to commercial agriculture. Subsistence farming involves growing enough food to feed your family, while commercial farming focuses on producing crops for sale in local and international markets. Both play vital roles in the country's agricultural sector.

Soil health is the foundation of successful farming. Liberian soils vary across the country, from the fertile alluvial soils near rivers to the laterite soils found in many upland areas. Before planting, it is important to understand your soil type by conducting simple tests. You can check soil pH, drainage, and nutrient content to determine which crops will thrive on your land.

Water management is equally critical. During the rainy season (May to October), farmers must manage excess water to prevent flooding and soil erosion. During the dry season, irrigation techniques such as drip irrigation and rainwater harvesting become essential. Learning to work with Liberia's seasonal patterns is key to a productive farm.` },
    { title: "Crop Selection and Planting Techniques", durationMinutes: 18, content: `Choosing the right crops for your farm depends on several factors: your soil type, available water, climate zone, market demand, and personal expertise. In Liberia, the most commonly grown staple crops include rice (both upland and lowland varieties), cassava, sweet potatoes, and plantains. Cash crops such as cocoa, coffee, rubber, and palm oil can provide significant income.

Rice is the most important staple food in Liberia. Upland rice is grown on hillsides without flooding, while lowland rice is cultivated in swampy or irrigated paddies. When planting rice, prepare the land by clearing, plowing, and leveling. Seeds should be soaked for 24 hours before broadcasting or transplanting seedlings at regular spacing of about 20cm apart.

Cassava is another vital crop that grows well in poor soils and requires minimal maintenance. Plant cassava stem cuttings at a 45-degree angle, burying two-thirds of the cutting. Space plants about 1 meter apart in rows. Cassava takes 8 to 18 months to mature depending on the variety, making it an excellent food security crop.

Intercropping is a traditional practice where two or more crops are grown together in the same field. For example, planting cassava with groundnuts or maize improves soil fertility through nitrogen fixation and maximizes land use. This technique reduces pest pressure and provides multiple harvests from the same plot.` },
    { title: "Pest Management and Harvest Practices", durationMinutes: 15, content: `Pest and disease management is crucial for protecting your crops and ensuring a good harvest. In Liberia, common agricultural pests include grasshoppers, stem borers, aphids, and rodents. Diseases such as cassava mosaic virus, rice blast, and black pod disease in cocoa can devastate crops if not managed properly.

Integrated Pest Management (IPM) is the recommended approach. IPM combines cultural, biological, and chemical methods to control pests while minimizing environmental damage. Cultural practices include crop rotation, which breaks pest life cycles, and maintaining clean fields by removing crop residues. Biological control uses natural predators like ladybugs to eat harmful insects.

When chemical pesticides are necessary, always follow safety guidelines. Wear protective clothing including gloves, masks, and long sleeves. Read and follow label instructions carefully. Never spray pesticides near water sources, and observe the recommended waiting period between spraying and harvesting. Store pesticides safely away from children and food.

Harvesting at the right time is essential for crop quality. Rice should be harvested when 80% of the grains have turned golden brown. Cassava can be left in the ground as a natural storage method but should be processed within 48 hours of harvest to prevent spoilage. Post-harvest handling is equally important. Proper drying, storage, and processing reduce losses and maintain crop quality.` },
  ],
  "Masonry & Building Construction": [
    { title: "Introduction to Masonry", durationMinutes: 15, content: `Masonry is one of the most essential construction trades in Liberia. From residential homes to commercial buildings, schools, and churches, masons create the structures that communities depend on. This course covers the fundamental skills needed to become a competent mason, including material knowledge, tool use, and basic construction techniques.

The primary materials used in Liberian masonry include concrete blocks (the most common building material), cement, sand, gravel, and water. Understanding the properties of these materials is essential for quality construction. Cement is the binding agent that holds everything together when mixed with water, sand, and gravel to form mortar or concrete.

Concrete blocks are manufactured in various sizes, with the standard block measuring 400mm x 200mm x 150mm. Blocks come in different grades suitable for different purposes: load-bearing blocks for structural walls and partition blocks for non-structural walls. Always inspect blocks for cracks, chips, and uniform size before use.

Essential masonry tools include the trowel (for spreading and shaping mortar), spirit level (for checking level and plumb), plumb bob (for checking vertical alignment), mason's line and pins (for maintaining straight courses), tape measure, and brick hammer. Keep your tools clean and in good condition, as dirty or damaged tools lead to poor quality work.` },
    { title: "Block Laying and Wall Construction", durationMinutes: 18, content: `Block laying is the core skill of masonry. Quality block laying requires consistent mortar joints, level and plumb walls, and proper bonding patterns. Before starting, set up your workspace with all materials within easy reach, and ensure you have a clean, level foundation to build on.

Mortar mixing is a critical skill. The standard mortar mix ratio for block laying is 1 part cement to 4-6 parts sand by volume. Add water gradually until the mortar has a workable consistency - it should hold its shape when squeezed but not be too dry or too wet. Mix only as much mortar as you can use within 30 minutes, as mortar begins to set after that time.

Start by laying the corner blocks first, using a spirit level to ensure they are level and plumb. Then stretch a mason's line between the corners to guide the intermediate blocks. Apply a bed of mortar about 10mm thick, place the block, and tap it into position with the trowel handle. Check each block for level and alignment before moving to the next one.

Bonding patterns determine how blocks overlap from one course to the next. The most common pattern is the running bond (or stretcher bond), where each block overlaps the one below by half its length. This creates a strong, stable wall. At corners, blocks from each wall alternate to create an interlocking pattern. Proper bonding is essential for structural strength.` },
    { title: "Plastering and Finishing Techniques", durationMinutes: 16, content: `Plastering transforms rough block walls into smooth, finished surfaces ready for painting or decorative treatment. Good plastering requires skill and practice, as the surface must be even, smooth, and free from cracks. In Liberia, both internal and external walls are typically plastered for protection and appearance.

Surface preparation is crucial for successful plastering. Clean the wall surface by removing loose mortar, dust, and debris. Dampen the wall with water before applying plaster to prevent the dry blocks from absorbing moisture from the plaster too quickly, which causes cracking. For smooth block surfaces, apply a bonding agent or scratch the surface to improve adhesion.

The standard plaster mix ratio is 1 part cement to 4 parts sand for external walls, and 1 part cement to 6 parts sand for internal walls. External plaster needs to be stronger to withstand weather. Apply plaster in two coats: a rough coat (about 12mm thick) scratched to provide a key for the finish coat, followed by a smooth finish coat (about 3mm thick) applied after the first coat has set but before it is fully dry.

Tiling is another important finishing skill. Tiles are used for floors, walls, and countertops, particularly in kitchens and bathrooms. Proper tiling requires a level substrate, correct adhesive application, consistent spacing with tile spacers, and proper grouting. Plan your tile layout before starting to minimize cuts and ensure a symmetrical pattern.` },
  ],
  "Fisheries & Aquaculture": [
    { title: "Introduction to Fisheries and Aquaculture", durationMinutes: 16, content: `Fisheries and aquaculture represent an important and growing sector in Liberia. With a 579-kilometer Atlantic coastline, numerous rivers, and wetland areas, Liberia has tremendous potential for both capture fisheries and fish farming. Fish is a major source of protein for Liberians, and developing this sector creates employment and improves food security.

Capture fisheries involve harvesting wild fish from oceans, rivers, and lakes. Liberia's coastal waters contain species including barracuda, snapper, grouper, and sardines. Inland waters provide tilapia, catfish, and other freshwater species. Sustainable fishing practices ensure that fish populations remain healthy for future generations.

Aquaculture, or fish farming, is the cultivation of fish in controlled environments such as ponds, tanks, or cages. In Liberia, tilapia and catfish are the most commonly farmed species because they grow quickly, tolerate various conditions, and are popular with consumers. Fish farming can be practiced on a small scale for family food security or commercially for income generation.

The advantages of aquaculture include reliable production (not dependent on weather or fish migration), control over growth conditions, year-round availability of fish, and the ability to farm in areas far from natural water bodies. With proper training, even farmers with small plots of land can successfully raise fish as an additional source of food and income.` },
    { title: "Fish Pond Construction and Management", durationMinutes: 18, content: `Constructing a fish pond requires careful site selection and planning. The ideal site has a reliable water source (spring, stream, or well), clay or clay-loam soil that holds water, gentle slope for drainage, and is accessible for feeding and harvesting. Avoid areas prone to flooding, near pollution sources, or with sandy soil that leaks water.

Pond design depends on the scale of your operation. A small family pond might be 10m x 10m x 1m deep, while commercial ponds can be much larger. The pond should have an inlet for adding water, an outlet for draining, and a slight slope from the inlet to the outlet for water circulation. The walls (dikes) should be compacted firmly and wide enough to walk on.

Construction steps include clearing the site, marking the pond dimensions, excavating the soil, compacting the dike walls, installing inlet and outlet pipes, and applying organic fertilizer to the pond bottom. The pond bottom can be fertilized with chicken manure or compost to encourage natural food production (phytoplankton and zooplankton) before stocking with fish.

Water quality management is the key to successful fish farming. Monitor temperature (25-30°C is ideal for tilapia), dissolved oxygen (above 5 mg/L), pH (6.5-8.5), and water color (green indicates good phytoplankton growth). Poor water quality causes stress, disease, and death in fish. Change 10-20% of the pond water weekly and avoid overfeeding, which depletes oxygen levels.` },
    { title: "Fish Feeding, Health, and Harvesting", durationMinutes: 15, content: `Proper feeding is essential for fish growth and profitability. Fish require protein, carbohydrates, fats, vitamins, and minerals in their diet. Commercial fish feed pellets provide balanced nutrition and are available in different sizes for different fish ages. For small-scale farmers, supplementary feeds can include rice bran, cassava leaves, termites, and kitchen scraps.

Feed fish 2-3 times daily at the same times and locations. Feed only what the fish can consume within 15-20 minutes to prevent waste and water quality problems. As fish grow, increase the amount of feed accordingly. A general guideline is to feed 3-5% of the total fish body weight per day, decreasing the percentage as fish get larger.

Fish health management focuses on prevention rather than treatment. Healthy fish are active, eat well, and have clear eyes and intact fins. Signs of illness include loss of appetite, abnormal swimming, discoloration, spots or lesions, and gasping at the surface. Common fish diseases include bacterial infections, fungal infections, and parasites. Maintaining good water quality and avoiding overcrowding are the best preventive measures.

Harvesting can be partial (removing some fish while leaving others to continue growing) or complete (draining the pond and collecting all fish). Partial harvesting allows you to sell fish throughout the year. Complete harvesting is done when most fish have reached market size. Handle harvested fish carefully to maintain quality, and get them to market or on ice as quickly as possible.` },
  ],
};

const courseQuizData: Record<string, QuizData[]> = {
  "Auto Mechanics Certificate": [
    { question: "What are the four strokes of an internal combustion engine in order?", options: ["Power, exhaust, intake, compression", "Intake, compression, power, exhaust", "Compression, intake, exhaust, power", "Exhaust, power, compression, intake"], correctIndex: 1, explanation: "The four-stroke cycle follows the order: intake (drawing in fuel-air), compression (squeezing the mixture), power (ignition), and exhaust (expelling gases)." },
    { question: "How often should engine oil typically be changed?", options: ["Every 1,000 km", "Every 5,000 to 7,500 km", "Every 20,000 km", "Only when the engine starts smoking"], correctIndex: 1, explanation: "Engine oil should be changed every 5,000 to 7,500 kilometers to maintain proper lubrication and engine protection." },
    { question: "What voltage should a fully charged car battery read with the engine off?", options: ["6.0 volts", "About 12.6 volts", "About 24 volts", "9.0 volts"], correctIndex: 1, explanation: "A fully charged 12-volt car battery should read approximately 12.6 volts when the engine is not running." },
    { question: "Why is overheating a common vehicle problem in Liberia?", options: ["Because vehicles are too old", "Due to high ambient temperatures stressing the cooling system", "Because fuel quality is poor", "Because roads are too smooth"], correctIndex: 1, explanation: "Liberia's hot tropical climate creates high ambient temperatures that put extra stress on vehicle cooling systems." },
    { question: "What should you NEVER do when working under a vehicle?", options: ["Use a flashlight", "Work alone", "Support it only with a jack without jack stands", "Wear gloves"], correctIndex: 2, explanation: "Never work under a vehicle supported only by a jack. Always use jack stands for safety, as jacks can fail and the vehicle can fall." },
  ],
  "Electrical Installation": [
    { question: "What does Ohm's Law state?", options: ["Voltage = Current + Resistance", "Voltage = Current x Resistance", "Current = Voltage x Resistance", "Resistance = Voltage x Current"], correctIndex: 1, explanation: "Ohm's Law states V = I x R (Voltage equals Current times Resistance)." },
    { question: "What is the recommended cable size for residential lighting circuits?", options: ["0.5mm²", "1.5mm²", "6mm²", "10mm²"], correctIndex: 1, explanation: "1.5mm² cables are standard for residential lighting circuits." },
    { question: "What color wire is typically used for earth/ground in Liberia?", options: ["Red", "Blue", "Brown", "Green/Yellow"], correctIndex: 3, explanation: "Green/yellow striped wire is used for earth/ground connections." },
    { question: "What type of circuit allows individual components to operate independently?", options: ["Series circuit", "Parallel circuit", "Open circuit", "Short circuit"], correctIndex: 1, explanation: "Parallel circuits allow each component to function independently of others." },
    { question: "What device protects against earth leakage faults?", options: ["Circuit breaker", "Fuse", "RCD (Residual Current Device)", "Transformer"], correctIndex: 2, explanation: "An RCD detects earth leakage faults that could cause electrocution and disconnects the circuit." },
  ],
  "Carpentry & Woodworking": [
    { question: "What is the ideal moisture content for indoor furniture wood?", options: ["5-8%", "12-15%", "25-30%", "40-50%"], correctIndex: 1, explanation: "Properly seasoned wood for indoor furniture should have 12-15% moisture content." },
    { question: "Which joint is considered the 'workhorse' of woodworking?", options: ["Butt joint", "Lap joint", "Mortise and tenon joint", "Nail joint"], correctIndex: 2, explanation: "The mortise and tenon joint is extremely strong and widely used for structural connections." },
    { question: "What happens when you work against the wood grain?", options: ["The wood becomes stronger", "You get a smoother finish", "It causes tear-out and rough surfaces", "Nothing different"], correctIndex: 2, explanation: "Working against the grain causes tear-out, leaving rough and uneven surfaces." },
    { question: "What is the carpenter's golden rule?", options: ["Cut first, measure later", "Measure twice, cut once", "Always use power tools", "Never use glue"], correctIndex: 1, explanation: "Measure twice, cut once prevents costly errors and wasted material." },
    { question: "Why is wood finishing especially important in Liberia?", options: ["For decoration only", "To prevent moisture damage, insects, and fungal growth", "To make wood heavier", "It is not important"], correctIndex: 1, explanation: "In Liberia's humid tropical climate, finishing protects wood from moisture, insects, and fungal growth." },
  ],
  "Computer Literacy & IT Basics": [
    { question: "What is the 'brain' of the computer called?", options: ["RAM", "Hard Drive", "CPU (Central Processing Unit)", "Monitor"], correctIndex: 2, explanation: "The CPU processes all instructions and performs calculations, making it the brain of the computer." },
    { question: "What is the correct way to turn off a computer?", options: ["Pull the power cord", "Press the power button", "Shut down through the Start menu", "Close the monitor"], correctIndex: 2, explanation: "Always shut down through the Start menu to allow the system to close properly and save data." },
    { question: "Which Excel formula adds numbers together?", options: ["AVERAGE", "COUNT", "SUM", "MAX"], correctIndex: 2, explanation: "The SUM formula adds numbers in a range of cells." },
    { question: "What makes a strong password?", options: ["Your birthday", "A single word", "Mix of letters, numbers, and symbols", "Your name"], correctIndex: 2, explanation: "Strong passwords use a combination of uppercase and lowercase letters, numbers, and special symbols." },
    { question: "What is phishing?", options: ["A computer game", "A type of virus", "Emails that trick you into revealing personal information", "A programming language"], correctIndex: 2, explanation: "Phishing is a cyber attack where fraudulent emails try to trick recipients into revealing sensitive information." },
  ],
  "Tailoring & Fashion Design": [
    { question: "What is the most important tool for a tailor?", options: ["Scissors", "The sewing machine", "Measuring tape", "Iron"], correctIndex: 1, explanation: "The sewing machine is a tailor's most important tool for efficient garment construction." },
    { question: "What does 'interfacing' do in garment construction?", options: ["Adds color", "Adds stiffness and structure", "Waterproofs the fabric", "Makes fabric softer"], correctIndex: 1, explanation: "Interfacing adds structure to areas like collars, cuffs, and button plackets." },
    { question: "What is the standard seam allowance?", options: ["5mm", "1.5cm", "3cm", "5cm"], correctIndex: 1, explanation: "The standard seam allowance is 1.5cm around pattern pieces." },
    { question: "What is the difference between amateur and professional garment work?", options: ["Thread color", "Pressing/ironing at each step", "Using expensive fabric", "Number of buttons"], correctIndex: 1, explanation: "Pressing seams at each step gives garments a professional, polished appearance." },
    { question: "Which fabric is most popular for traditional occasions in Liberia?", options: ["Denim", "Polyester", "Ankara/African print", "Nylon"], correctIndex: 2, explanation: "Ankara/African print fabric is preferred for traditional and cultural celebrations." },
  ],
  "Welding & Metal Fabrication": [
    { question: "What type of welding is most common in Liberia?", options: ["TIG welding", "MIG welding", "Stick welding (SMAW)", "Laser welding"], correctIndex: 2, explanation: "Stick welding (SMAW) is most common in Liberia because equipment is affordable and portable." },
    { question: "What is the minimum lens shade for arc welding?", options: ["Shade 3", "Shade 5", "Shade 10", "No shade needed"], correctIndex: 2, explanation: "A minimum shade 10-13 is required to protect eyes from the intense arc light." },
    { question: "What causes porosity in a weld?", options: ["Too much heat", "Small holes from gas trapped in the weld", "Using too much filler metal", "Welding too slowly"], correctIndex: 1, explanation: "Porosity consists of small holes caused by gas becoming trapped in the solidifying weld metal." },
    { question: "What should you do before making full welds on a fabrication project?", options: ["Paint the metal", "Tack weld pieces in position first", "Clean with water", "Wait 24 hours"], correctIndex: 1, explanation: "Tack welding holds pieces in the correct position before completing full welds." },
    { question: "Why is ventilation important when welding?", options: ["To keep the metal cool", "To avoid inhaling toxic fumes", "To reduce noise", "To prevent rust"], correctIndex: 1, explanation: "Welding produces harmful fumes that can cause serious respiratory problems if inhaled." },
  ],
  "Plumbing & Pipe Fitting": [
    { question: "What are the two main subsystems of a plumbing system?", options: ["Hot and cold water", "Water supply and drainage", "Kitchen and bathroom", "Indoor and outdoor"], correctIndex: 1, explanation: "Every plumbing system has a water supply system (clean water in) and a drainage system (wastewater out)." },
    { question: "What is the standard slope for drain pipes?", options: ["1/4 inch per foot (2% grade)", "1 inch per foot", "Zero slope (level)", "3 inches per foot"], correctIndex: 0, explanation: "A 1/4 inch per foot slope ensures proper drainage flow without being too steep or too shallow." },
    { question: "What is the purpose of a P-trap?", options: ["To filter water", "To prevent sewer gases from entering the building", "To increase water pressure", "To measure water flow"], correctIndex: 1, explanation: "The P-trap holds a small amount of water that blocks sewer gases from entering the building." },
    { question: "Which pipe material uses solvent cement for joining?", options: ["Copper", "Galvanized steel", "PVC", "PPR"], correctIndex: 2, explanation: "PVC pipes are joined using solvent cement (glue) that chemically bonds the pieces together." },
    { question: "What should you always check after installing a fixture?", options: ["The color", "For leaks", "The brand name", "The warranty"], correctIndex: 1, explanation: "Always check all connections for leaks after installation by running water through the system." },
  ],
  "Mobile Phone Repair": [
    { question: "What is the first thing to do when a customer brings a phone for repair?", options: ["Start disassembling it", "Gather information about the problem", "Replace the screen", "Charge it"], correctIndex: 1, explanation: "Always start by gathering information about the problem to make an accurate diagnosis." },
    { question: "What temperature is recommended for heat guns when removing screens?", options: ["About 80°C", "About 200°C", "About 400°C", "Room temperature"], correctIndex: 0, explanation: "About 80°C is sufficient to soften the adhesive without damaging internal components." },
    { question: "What should you disconnect FIRST when opening a phone?", options: ["The screen cable", "The camera", "The battery", "The speaker"], correctIndex: 2, explanation: "Always disconnect the battery first to prevent short circuits while working on the phone." },
    { question: "What indicates a failing smartphone battery?", options: ["Screen getting brighter", "Rapid battery drain and possible swelling", "Louder speakers", "Faster charging"], correctIndex: 1, explanation: "Failing batteries show rapid drain, premature shutoffs, physical swelling, and overheating." },
    { question: "What is the best marketing strategy for a phone repair business in Liberia?", options: ["TV advertising", "Social media only", "Building a reputation for honest, quality work", "Giving away free phones"], correctIndex: 2, explanation: "In Liberia's close-knit communities, word-of-mouth from honest, quality work is the most effective marketing." },
  ],
  "Solar Panel Installation": [
    { question: "What are the four main components of an off-grid solar system?", options: ["Panels, wires, fuses, meter", "Panels, charge controller, batteries, inverter", "Panels, generator, transformer, meter", "Panels, wind turbine, batteries, grid"], correctIndex: 1, explanation: "An off-grid system needs panels (generation), charge controller (regulation), batteries (storage), and inverter (DC to AC conversion)." },
    { question: "How many peak sun hours does Liberia receive on average?", options: ["1-2 hours", "4.5-5.5 hours", "8-10 hours", "12 hours"], correctIndex: 1, explanation: "Liberia receives an average of 4.5-5.5 peak sun hours per day." },
    { question: "What is the recommended tilt angle for solar panels in Liberia?", options: ["45 degrees", "6-8 degrees", "90 degrees (vertical)", "0 degrees (flat)"], correctIndex: 1, explanation: "Since Liberia is near the equator (latitude ~6°), panels should be tilted at approximately 6-8 degrees." },
    { question: "Why are MPPT charge controllers preferred over PWM?", options: ["They are cheaper", "They are smaller", "They extract up to 30% more energy from panels", "They don't need batteries"], correctIndex: 2, explanation: "MPPT controllers use maximum power point tracking to harvest up to 30% more energy than PWM controllers." },
    { question: "How often should solar panels be cleaned?", options: ["Never", "Monthly", "Once a year", "Every 5 years"], correctIndex: 1, explanation: "Clean panels monthly to remove dust, dirt, and bird droppings that reduce energy production." },
  ],
  "Hospitality & Catering": [
    { question: "What is the cornerstone of the hospitality industry?", options: ["Expensive decor", "Customer service", "Large staff", "High prices"], correctIndex: 1, explanation: "Customer service is the foundation of hospitality - every guest interaction matters." },
    { question: "At what temperature should hot food be maintained?", options: ["Above 30°C", "Above 60°C", "Above 100°C", "Room temperature"], correctIndex: 1, explanation: "Hot food must be kept above 60°C to prevent bacterial growth in the danger zone." },
    { question: "How long should you wash your hands in a food service environment?", options: ["5 seconds", "10 seconds", "20 seconds", "1 minute"], correctIndex: 2, explanation: "Wash hands for at least 20 seconds with soap and warm water to effectively remove bacteria." },
    { question: "How much extra food should you prepare for unexpected guests at catered events?", options: ["50% extra", "10-15% extra", "No extra needed", "Double the amount"], correctIndex: 1, explanation: "Plan for 10-15% extra portions to accommodate unexpected guests and second servings." },
    { question: "What is the most important post-event activity for caterers?", options: ["Throwing away leftovers", "Seeking client feedback", "Taking photos", "Counting money"], correctIndex: 1, explanation: "Seeking client feedback helps improve your service for future events." },
  ],
  "Cosmetology & Hairdressing": [
    { question: "What are the three layers of hair?", options: ["Root, shaft, tip", "Cuticle, cortex, medulla", "Skin, muscle, bone", "Inner, middle, outer"], correctIndex: 1, explanation: "Hair consists of the cuticle (protective outer layer), cortex (strength/color), and medulla (inner core)." },
    { question: "Why is scalp massage beneficial?", options: ["It makes hair longer instantly", "It increases blood circulation and promotes growth", "It changes hair color", "It is only for relaxation"], correctIndex: 1, explanation: "Scalp massage increases blood circulation to hair follicles, promoting healthier hair growth." },
    { question: "What must be done to salon tools between clients?", options: ["Nothing special", "Cleaned and disinfected", "Thrown away", "Rinsed with water only"], correctIndex: 1, explanation: "All tools must be cleaned and disinfected between clients to prevent spread of infections." },
    { question: "What should always be done before applying a chemical relaxer?", options: ["Apply moisturizer", "Perform a strand test", "Cut the hair short", "Wash with cold water"], correctIndex: 1, explanation: "A strand test checks how the hair reacts to the chemical to prevent damage or adverse reactions." },
    { question: "Which skin type is most common in Liberia's tropical climate?", options: ["Dry skin", "Normal skin", "Oily and combination skin", "Sensitive skin"], correctIndex: 2, explanation: "Oily and combination skin are common in Liberia due to the heat and humidity of the tropical climate." },
  ],
  "Agriculture & Farming": [
    { question: "What percentage of Liberia's population is employed in agriculture?", options: ["Over 70%", "About 30%", "Less than 10%", "About 50%"], correctIndex: 0, explanation: "Agriculture employs over 70% of Liberia's population, making it the backbone of the economy." },
    { question: "What is intercropping?", options: ["Growing crops in a greenhouse", "Growing two or more crops together in the same field", "Using only organic fertilizer", "Planting crops in straight rows"], correctIndex: 1, explanation: "Intercropping grows multiple crops together to improve soil fertility and maximize land use." },
    { question: "When should rice be harvested?", options: ["When grains are still green", "When 80% of grains are golden brown", "After the rainy season only", "Any time"], correctIndex: 1, explanation: "Rice should be harvested when approximately 80% of the grains have turned golden brown." },
    { question: "What is the recommended approach for pest control?", options: ["Always use strong chemicals", "Integrated Pest Management (IPM)", "Ignore pests", "Remove all plants"], correctIndex: 1, explanation: "IPM combines cultural, biological, and chemical methods for effective, environmentally responsible pest control." },
    { question: "How soon should cassava be processed after harvest?", options: ["Within 1 hour", "Within 48 hours", "Within 1 week", "Within 1 month"], correctIndex: 1, explanation: "Cassava should be processed within 48 hours of harvest to prevent spoilage." },
  ],
  "Masonry & Building Construction": [
    { question: "What is the standard mortar mix ratio for block laying?", options: ["1:1 (cement to sand)", "1:4 to 1:6 (cement to sand)", "1:10 (cement to sand)", "Only cement, no sand"], correctIndex: 1, explanation: "The standard mix is 1 part cement to 4-6 parts sand by volume." },
    { question: "What bonding pattern has each block overlapping the one below by half?", options: ["Stack bond", "Running bond (stretcher bond)", "Herringbone", "Basket weave"], correctIndex: 1, explanation: "Running bond (stretcher bond) offsets blocks by half their length for structural strength." },
    { question: "Why should walls be dampened before plastering?", options: ["For decoration", "To prevent dry blocks from absorbing moisture from plaster too quickly", "To make blocks heavier", "It is not necessary"], correctIndex: 1, explanation: "Dampening prevents dry blocks from pulling moisture from plaster, which would cause cracking." },
    { question: "What is the plaster mix ratio for external walls?", options: ["1:2 (cement to sand)", "1:4 (cement to sand)", "1:8 (cement to sand)", "1:10 (cement to sand)"], correctIndex: 1, explanation: "External plaster uses 1:4 ratio for greater strength to withstand weather exposure." },
    { question: "How many coats of plaster are typically applied?", options: ["One thick coat", "Two coats (rough coat + finish coat)", "Three coats", "Four coats"], correctIndex: 1, explanation: "Two coats are standard: a rough coat (12mm) for adhesion and a finish coat (3mm) for smooth appearance." },
  ],
  "Fisheries & Aquaculture": [
    { question: "What are the most commonly farmed fish species in Liberia?", options: ["Salmon and trout", "Tilapia and catfish", "Tuna and sardines", "Carp and bass"], correctIndex: 1, explanation: "Tilapia and catfish are preferred because they grow quickly and tolerate various conditions." },
    { question: "What is the ideal water temperature for tilapia farming?", options: ["5-10°C", "15-20°C", "25-30°C", "35-40°C"], correctIndex: 2, explanation: "Tilapia thrives at water temperatures between 25-30°C." },
    { question: "How often should fish be fed?", options: ["Once a week", "Once a day", "2-3 times daily", "Every hour"], correctIndex: 2, explanation: "Fish should be fed 2-3 times daily at consistent times and locations." },
    { question: "What soil type is best for fish pond construction?", options: ["Sandy soil", "Rocky soil", "Clay or clay-loam soil", "Gravel"], correctIndex: 2, explanation: "Clay or clay-loam soil holds water well, preventing seepage and pond leakage." },
    { question: "What is the most important preventive measure for fish health?", options: ["Adding antibiotics regularly", "Maintaining good water quality", "Keeping fish in the dark", "Feeding as much as possible"], correctIndex: 1, explanation: "Good water quality and avoiding overcrowding are the best ways to prevent fish disease." },
  ],
};

export async function seedCoursesAndProviders() {
  try {
    const existingCourses = await db.select({ id: courses.id }).from(courses).limit(1);
    if (existingCourses.length > 0) {
      console.log("Courses already exist, skipping course seeding.");
      return;
    }

    console.log("Seeding training providers...");
    for (const provider of providers) {
      try {
        await db.insert(trainingProviders).values(provider).onConflictDoNothing();
      } catch (e) {
        console.log(`Provider ${provider.name} may already exist`);
      }
    }

    console.log("Seeding 14 courses with lessons and quizzes...");
    for (const course of courseData) {
      const courseId = crypto.randomUUID();
      try {
        await db.insert(courses).values({
          id: courseId,
          ...course,
        });

        const lessons = courseLessonData[course.title];
        if (lessons) {
          for (let i = 0; i < lessons.length; i++) {
            await db.insert(courseLessons).values({
              id: crypto.randomUUID(),
              courseId,
              title: lessons[i].title,
              content: lessons[i].content,
              orderIndex: i,
              durationMinutes: lessons[i].durationMinutes,
            });
          }
        }

        const quizzes = courseQuizData[course.title];
        if (quizzes) {
          for (let i = 0; i < quizzes.length; i++) {
            await db.insert(courseQuizQuestions).values({
              id: crypto.randomUUID(),
              courseId,
              question: quizzes[i].question,
              options: quizzes[i].options,
              correctIndex: quizzes[i].correctIndex,
              explanation: quizzes[i].explanation,
              orderIndex: i,
            });
          }
        }

        console.log(`Seeded course: ${course.title}`);
      } catch (e) {
        console.log(`Error seeding course ${course.title}:`, e);
      }
    }

    console.log("Course seeding complete! 14 courses, 42 lessons, 70 quiz questions created.");
  } catch (error) {
    console.error("Failed to seed courses:", error);
  }
}

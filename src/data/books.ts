import type { Book } from '@/types'

const navy = '#2E3F5C'
const forest = '#34553F'
const rust = '#8A4B2E'
const slate = '#4A5662'
const plum = '#5B3A52'
const ochre = '#94702F'

type Row = [
  id: string,
  title: string,
  authors: string[],
  isbn: string,
  genre: string,
  publisher: string,
  year: number,
  shelf: string,
  color: string,
  copies: number,
  description: string,
  language?: string,
]

const rows: Row[] = [
  ['b001', 'Introduction to Algorithms', ['Thomas H. Cormen', 'Charles E. Leiserson', 'Ronald L. Rivest', 'Clifford Stein'], '978-0262033848', 'Computer Science', 'MIT Press', 2009, 'CS-114', navy, 5, 'The standard reference on algorithm design and analysis, covering sorting, graph algorithms, dynamic programming and NP-completeness with rigorous proofs and pseudocode.'],
  ['b002', 'Let Us C', ['Yashavant Kanetkar'], '978-9389845686', 'Computer Science', 'BPB Publications', 2020, 'CS-102', rust, 6, 'A first-semester favourite that teaches C programming through short chapters, worked examples and graded exercises.'],
  ['b003', 'Operating System Concepts', ['Abraham Silberschatz', 'Peter B. Galvin', 'Greg Gagne'], '978-1119320913', 'Computer Science', 'Wiley', 2018, 'CS-121', forest, 4, 'Processes, threads, scheduling, memory management, file systems and security, explained with examples from Linux, Windows and mobile systems.'],
  ['b004', 'Computer Networks', ['Andrew S. Tanenbaum', 'David J. Wetherall'], '978-0132126953', 'Computer Science', 'Pearson', 2010, 'CS-130', slate, 4, 'A layer-by-layer tour of networking, from the physical layer to applications, with case studies on the internet and wireless networks.'],
  ['b005', 'Database System Concepts', ['Abraham Silberschatz', 'Henry F. Korth', 'S. Sudarshan'], '978-0078022159', 'Computer Science', 'McGraw Hill', 2019, 'CS-125', plum, 3, 'Relational models, SQL, normalisation, transactions and query processing, with a clear path from theory to implementation.'],
  ['b006', 'Clean Code', ['Robert C. Martin'], '978-0132350884', 'Computer Science', 'Prentice Hall', 2008, 'CS-140', ochre, 2, 'Practical guidance on writing readable, maintainable code, with refactoring case studies and a catalogue of code smells.'],
  ['b007', 'The C Programming Language', ['Brian W. Kernighan', 'Dennis M. Ritchie'], '978-0131103627', 'Computer Science', 'Prentice Hall', 1988, 'CS-101', navy, 3, 'The concise classic by the creators of C. Compact, precise and still the best description of the language.'],
  ['b008', 'Artificial Intelligence: A Modern Approach', ['Stuart Russell', 'Peter Norvig'], '978-0134610993', 'Computer Science', 'Pearson', 2020, 'CS-150', slate, 3, 'Search, knowledge representation, planning, probabilistic reasoning and machine learning in one comprehensive text.'],
  ['b009', 'Computer Organization and Design', ['David A. Patterson', 'John L. Hennessy'], '978-0124077263', 'Computer Science', 'Morgan Kaufmann', 2013, 'CS-118', forest, 3, 'How hardware and software meet: instruction sets, arithmetic, pipelining and the memory hierarchy, using the MIPS architecture.'],
  ['b010', 'Data Structures Using C', ['Reema Thareja'], '978-0198099307', 'Computer Science', 'Oxford University Press', 2014, 'CS-108', rust, 5, 'Arrays, linked lists, stacks, queues, trees and graphs implemented step by step in C, aligned with university syllabi.'],
  ['b011', 'Compilers: Principles, Techniques, and Tools', ['Alfred V. Aho', 'Monica S. Lam', 'Ravi Sethi', 'Jeffrey D. Ullman'], '978-0321486813', 'Computer Science', 'Pearson', 2006, 'CS-133', plum, 2, 'The dragon book. Lexical analysis, parsing, syntax-directed translation, code generation and optimisation.'],
  ['b012', 'Head First Java', ['Kathy Sierra', 'Bert Bates'], '978-0596009205', 'Computer Science', "O'Reilly", 2005, 'CS-145', ochre, 3, 'An approachable, visual introduction to object-oriented programming in Java.'],
  ['b013', 'Digital Design', ['M. Morris Mano', 'Michael D. Ciletti'], '978-0134549897', 'Electronics', 'Pearson', 2017, 'EC-208', navy, 4, 'Boolean algebra, combinational and sequential logic, and an introduction to Verilog HDL for digital system design.'],
  ['b014', 'Signals and Systems', ['Alan V. Oppenheim', 'Alan S. Willsky', 'S. Hamid Nawab'], '978-0138147570', 'Electronics', 'Pearson', 1996, 'EC-215', slate, 2, 'Continuous and discrete-time signals, Fourier analysis, Laplace and z-transforms, sampling and filtering.'],
  ['b015', 'Microelectronic Circuits', ['Adel S. Sedra', 'Kenneth C. Smith'], '978-0199339136', 'Electronics', 'Oxford University Press', 2014, 'EC-221', forest, 4, 'Diodes, BJTs, MOSFETs, amplifiers and digital CMOS circuits, with a strong emphasis on design intuition.'],
  ['b016', 'Electronic Devices and Circuit Theory', ['Robert L. Boylestad', 'Louis Nashelsky'], '978-0132622264', 'Electronics', 'Pearson', 2013, 'EC-203', rust, 5, 'A thorough foundation in semiconductor devices and the circuits built from them.'],
  ['b017', 'Communication Systems', ['Simon Haykin'], '978-0471697909', 'Electronics', 'Wiley', 2009, 'EC-230', plum, 3, 'Analog and digital modulation, noise, and information theory for undergraduate communication courses.'],
  ['b018', 'The 8051 Microcontroller and Embedded Systems', ['Muhammad Ali Mazidi', 'Janice G. Mazidi'], '978-8131710265', 'Electronics', 'Pearson', 2007, 'EC-240', ochre, 3, 'Assembly and C programming for the 8051, with interfacing examples for timers, serial ports and sensors.'],
  ['b019', 'Digital Signal Processing', ['John G. Proakis', 'Dimitris G. Manolakis'], '978-0131873742', 'Electronics', 'Pearson', 2007, 'EC-218', navy, 2, 'Discrete-time systems, the DFT and FFT, and the design of FIR and IIR filters.'],
  ['b020', 'Engineering Thermodynamics', ['P. K. Nag'], '978-1259062568', 'Mechanical', 'McGraw Hill', 2013, 'ME-304', rust, 4, 'Laws of thermodynamics, properties of pure substances, power and refrigeration cycles, with solved examples.'],
  ['b021', 'Theory of Machines', ['S. S. Rattan'], '978-9351343479', 'Mechanical', 'McGraw Hill', 2014, 'ME-312', slate, 3, 'Kinematics and dynamics of mechanisms, gears, cams, flywheels, governors and balancing.'],
  ['b022', 'Strength of Materials', ['R. K. Bansal'], '978-8131808146', 'Mechanical', 'Laxmi Publications', 2010, 'ME-318', forest, 5, 'Stress, strain, bending, torsion and deflection of beams, with many worked numerical problems.'],
  ['b023', 'Fluid Mechanics and Hydraulic Machines', ['R. K. Bansal'], '978-8131808153', 'Mechanical', 'Laxmi Publications', 2010, 'ME-322', navy, 4, 'Fluid statics, kinematics, flow through pipes and the design of turbines and pumps.'],
  ['b024', 'Design of Machine Elements', ['V. B. Bhandari'], '978-9339221126', 'Mechanical', 'McGraw Hill', 2016, 'ME-330', ochre, 3, 'Design of shafts, couplings, springs, bearings and gears, following Indian standards.'],
  ['b025', 'Engineering Drawing', ['N. D. Bhatt'], '978-9380358963', 'Mechanical', 'Charotar Publishing', 2014, 'ME-301', plum, 6, 'Projections, sections, developments and isometric views, with plates for practice.'],
  ['b026', 'Higher Engineering Mathematics', ['B. S. Grewal'], '978-8193328491', 'Mathematics', 'Khanna Publishers', 2017, 'MA-401', navy, 6, 'The go-to engineering mathematics text: calculus, differential equations, transforms, numerical methods and statistics.'],
  ['b027', 'Advanced Engineering Mathematics', ['Erwin Kreyszig'], '978-0470458365', 'Mathematics', 'Wiley', 2011, 'MA-405', forest, 3, 'Linear algebra, vector calculus, complex analysis and PDEs, with applications across engineering disciplines.'],
  ['b028', 'Discrete Mathematics and Its Applications', ['Kenneth H. Rosen'], '978-1259676512', 'Mathematics', 'McGraw Hill', 2018, 'MA-410', rust, 4, 'Logic, proofs, combinatorics, graphs and trees, written for computer science students.'],
  ['b029', 'Linear Algebra and Its Applications', ['Gilbert Strang'], '978-0030105678', 'Mathematics', 'Cengage', 2005, 'MA-414', slate, 2, 'A geometric, application-first approach to matrices, vector spaces, eigenvalues and least squares.'],
  ['b030', 'Probability and Statistics for Engineers and Scientists', ['Ronald E. Walpole', 'Raymond H. Myers', 'Sharon L. Myers', 'Keying Ye'], '978-0134115856', 'Mathematics', 'Pearson', 2016, 'MA-418', plum, 3, 'Probability distributions, estimation, hypothesis testing and regression with engineering datasets.'],
  ['b031', 'The Alchemist', ['Paulo Coelho'], '978-0062315007', 'Fiction', 'HarperOne', 2014, 'FI-503', ochre, 4, 'A young shepherd travels from Spain to the Egyptian desert in search of treasure, and learns to listen to his heart.'],
  ['b032', 'The God of Small Things', ['Arundhati Roy'], '978-0006550686', 'Fiction', 'Fourth Estate', 1997, 'FI-515', forest, 2, 'Twins in Ayemenem, Kerala, and the small events that reshape a family. Winner of the Booker Prize.'],
  ['b033', 'Malgudi Days', ['R. K. Narayan'], '978-0143039655', 'Fiction', 'Penguin', 2006, 'FI-520', rust, 3, 'Short stories set in the fictional South Indian town of Malgudi, full of warmth and quiet humour.'],
  ['b034', 'To Kill a Mockingbird', ['Harper Lee'], '978-0060935467', 'Fiction', 'Harper Perennial', 2006, 'FI-524', slate, 2, 'Scout Finch grows up in 1930s Alabama as her father defends a Black man accused of a crime.'],
  ['b035', 'Parva', ['S. L. Bhyrappa'], '978-8172015213', 'Fiction', 'Sahitya Bhandara', 1979, 'FI-531', plum, 2, 'A retelling of the Mahabharata stripped of the miraculous, told through the inner lives of its characters.', 'Kannada'],
  ['b036', 'Mookajjiya Kanasugalu', ['K. Shivaram Karanth'], '978-8172012328', 'Fiction', 'Sapna Book House', 1968, 'FI-533', navy, 2, 'An old woman with visionary insight reflects on gods, history and human belief. Jnanpith Award winner.', 'Kannada'],
  ['b037', 'Quantitative Aptitude for Competitive Examinations', ['R. S. Aggarwal'], '978-9352534029', 'Competitive Exams', 'S. Chand', 2017, 'CE-702', rust, 5, 'Arithmetic, data interpretation and shortcut methods for placement tests and government exams.'],
  ['b038', 'A Modern Approach to Verbal and Non-Verbal Reasoning', ['R. S. Aggarwal'], '978-9352534043', 'Competitive Exams', 'S. Chand', 2018, 'CE-705', forest, 4, 'Series, analogies, coding-decoding, puzzles and figure reasoning with thousands of practice questions.'],
  ['b039', 'Indian Polity', ['M. Laxmikanth'], '978-9353166335', 'Competitive Exams', 'McGraw Hill', 2019, 'CE-712', ochre, 3, 'The constitutional framework, government and governance of India, written for civil services aspirants.'],
  ['b040', 'Word Power Made Easy', ['Norman Lewis'], '978-0671741907', 'Competitive Exams', 'Pocket Books', 1991, 'CE-718', slate, 3, 'A structured vocabulary builder organised around word roots, with self-tests in every session.'],
  ['b041', "Oxford Advanced Learner's Dictionary", ['A. S. Hornby'], '978-0194798488', 'Reference', 'Oxford University Press', 2020, 'RF-601', navy, 2, 'Definitions, usage notes and example sentences for learners and writers of English.'],
  ['b042', 'Wings of Fire', ['A. P. J. Abdul Kalam', 'Arun Tiwari'], '978-8173711466', 'Reference', 'Universities Press', 1999, 'RF-610', rust, 4, "The autobiography of India's missile man and former president, from Rameswaram to the space programme."],
  ['b043', 'Sapiens', ['Yuval Noah Harari'], '978-0099590088', 'Reference', 'Vintage', 2015, 'RF-612', plum, 3, 'A brief history of humankind, from foragers to the scientific revolution and beyond.'],
]

export const books: Book[] = rows.map(
  ([_id, title, authors, isbn, genre, publisher, year, shelfLocation, coverColor, totalCopies, description, language = 'English']) => ({
    _id,
    title,
    authors,
    isbn,
    genres: [genre],
    publisher,
    year,
    language,
    description,
    shelfLocation,
    coverColor,
    totalCopies,
    availableCopies: totalCopies,
  }),
)

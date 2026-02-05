
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askTheCosmos = async (question: string, theme: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{ text: `User Question: ${question}\n\nContext: You are an entity with infinite wisdom regarding ${theme}.` }]
      }],
      config: {
        systemInstruction: `You are the manifestation of Cosmic Intelligence. Provide a profound, scientifically grounded yet philosophically deep response. 
        Focus strictly on the theme of ${theme}. 
        Keep your response between 40 and 65 words. 
        Do not use flowery introductions or conclusions. Just the wisdom.`,
        temperature: 0.8,
        topP: 0.95,
      }
    });

    if (!response.text) {
      throw new Error("Empty response from the cosmos.");
    }

    return response.text;
  } catch (error) {
    console.error("Cosmic Connection Error:", error);
    return "The stars are currently silent. The connection to the infinite is flickering. Please try querying another node.";
  }
};

export const getThemeNodes = async (themeId: number): Promise<{question: string, answer: string}[]> => {
  const data: Record<number, {question: string, answer: string}[]> = {
    1: [ // Big Bang
      { question: "How did the universe begin?", answer: "The Big Bang theory suggests the universe started as a singularity roughly 13.8 billion years ago, rapidly expanding from an infinitely hot and dense state." },
      { question: "What is dark matter?", answer: "Dark matter is an invisible substance making up 27% of the universe, detectable only through its gravitational influence on visible galaxies." },
      { question: "What happened in the first second?", answer: "In the first second, the four fundamental forces separated, and the universe underwent cosmic inflation, growing exponentially in a fraction of a moment." },
      { question: "What is Cosmic Microwave Background?", answer: "The CMB is the afterglow of the Big Bang, a snapshot of the oldest light in the universe imprinted on the sky when atoms first formed." },
      { question: "How large is the observable universe?", answer: "It spans roughly 93 billion light-years in diameter, limited by the distance light has traveled since the Big Bang and cosmic expansion." },
      { question: "What is dark energy?", answer: "Dark energy is a mysterious repulsive force making up 68% of the universe, responsible for the accelerating expansion of space-time." },
      { question: "What was the era of nucleosynthesis?", answer: "During the first few minutes, the universe was hot enough for protons and neutrons to fuse into the first atomic nuclei, mostly hydrogen and helium." },
      { question: "What are primordial gravitational waves?", answer: "These are ripples in space-time created during the violent expansion of inflation, potentially holding secrets of the universe's absolute beginning." },
      { question: "Did the Big Bang happen at a point?", answer: "No, the Big Bang happened everywhere at once. It wasn't an explosion in space, but an explosion OF space expanding into itself." },
      { question: "What is cosmic inflation?", answer: "Inflation is a period of ultra-fast expansion that smoothed out the universe and provided the seeds for galaxy formation via quantum fluctuations." },
      { question: "What is the baryogenesis mystery?", answer: "It is the unknown process that created a slight excess of matter over antimatter, allowing the material world we see today to exist." },
      { question: "Is the universe infinite?", answer: "While the observable universe is finite, the total universe may be infinite, or it may curve back on itself in a complex topological shape." }
    ],
    2: [ // AI
      { question: "What is a Neural Network?", answer: "A neural network is a computational model inspired by biological brains, consisting of interconnected nodes that learn patterns through weighted signal adjustments." },
      { question: "What is AGI?", answer: "Artificial General Intelligence is a hypothetical AI that can learn and perform any intellectual task a human can, possessing cross-domain reasoning and self-awareness." },
      { question: "What is backpropagation?", answer: "Backpropagation is the fundamental algorithm for training neural networks, calculating gradients of loss to update weights and improve predictive accuracy." },
      { question: "How does deep learning differ from AI?", answer: "Deep learning is a specific subset of machine learning using multi-layered neural networks to extract high-level features from raw data." },
      { question: "What is the alignment problem?", answer: "The alignment problem is the challenge of ensuring AI systems' goals and behaviors remain consistent with human values and safety." },
      { question: "What are Large Language Models?", answer: "LLMs are massive neural networks trained on vast text data to predict the next token, resulting in emergent capabilities like reasoning and coding." },
      { question: "What is reinforcement learning?", answer: "It is a training method where agents learn to make decisions by performing actions in an environment to maximize a reward signal." },
      { question: "What is a transformer architecture?", answer: "The transformer is a neural architecture utilizing self-attention mechanisms to process sequences of data in parallel, revolutionizing natural language processing." },
      { question: "What is symbolic AI?", answer: "Also known as GOFAI, symbolic AI relies on explicit rules and logic gates to manipulate symbols, contrasting with modern statistical neural approaches." },
      { question: "Can AI be truly creative?", answer: "AI generates novelty by recombining patterns in high-dimensional latent space, though the intent and subjective meaning remain rooted in human interpretation." },
      { question: "What is federated learning?", answer: "Federated learning allows models to train on decentralized data across multiple devices without ever sharing the raw data itself, protecting privacy." },
      { question: "What are neuromorphic chips?", answer: "Neuromorphic hardware mimics the physical structure of biological neurons to achieve extreme energy efficiency and massive parallelism." }
    ],
    3: [ // Alien Life
      { question: "Where is everyone?", answer: "The Fermi Paradox asks why we haven't found evidence of aliens despite the billions of stars and high probability of habitable planets." },
      { question: "What are biosignatures?", answer: "Biosignatures are chemical markers, like oxygen-methane imbalances in an atmosphere, that suggest the presence of biological processes." },
      { question: "What is the Great Filter?", answer: "The Great Filter theory suggests there is a stage in evolution that is nearly impossible to pass, preventing civilizations from becoming interstellar." },
      { question: "What is the Drake Equation?", answer: "A probabilistic formula used to estimate the number of active, communicative extraterrestrial civilizations in the Milky Way galaxy." },
      { question: "Can life exist on Europa?", answer: "Jupiter's moon Europa likely hides a vast saltwater ocean beneath its icy crust, potentially kept warm by tidal heating and harboring life." },
      { question: "What is SETI?", answer: "The Search for Extraterrestrial Intelligence is a scientific effort to detect electromagnetic signals from technological civilizations across the cosmos." },
      { question: "What is panspermia?", answer: "Panspermia is the hypothesis that life exists throughout the Universe, distributed by space dust, meteoroids, asteroids, and comets." },
      { question: "What defines the habitable zone?", answer: "The 'Goldilocks Zone' is the region around a star where temperatures allow liquid water to exist on a planet's surface." },
      { question: "What are technosignatures?", answer: "Technosignatures are evidence of advanced technology, such as radio beams, Dyson spheres, or atmospheric pollutants from industrial alien worlds." },
      { question: "Could aliens be silicon-based?", answer: "While carbon is more versatile, silicon shares similar bonding properties and might form life in high-temperature or non-aqueous environments." },
      { question: "What is the Rare Earth Hypothesis?", answer: "This theory argues that the conditions required for complex, multicellular life are so unique that Earth might be a cosmic fluke." },
      { question: "How would we communicate?", answer: "Scientists propose using universal constants like prime numbers or the hydrogen line frequency (1420 MHz) as a cosmic handshake." }
    ],
    4: [ // Mind Uploading
      { question: "What is whole brain emulation?", answer: "WBE is the process of scanning a biological brain's structure in atomic detail and recreating its functional logic in a digital substrate." },
      { question: "What is the connectome?", answer: "The connectome is a comprehensive map of all neural connections in a brain, theorized to be the blueprint of an individual's consciousness." },
      { question: "Is digital identity possible?", answer: "Philosophers debate whether a digital copy is 'you' or just a simulation that behaves like you while the original 'self' ceases to exist." },
      { question: "What is substrate independence?", answer: "The idea that consciousness is a computational process that can run on any hardware capable of the necessary complexity, not just biological brains." },
      { question: "What is the 'Ship of Theseus' problem?", answer: "If you replace neurons with chips one by one, at what point (if any) does the original person disappear and a machine remain?" },
      { question: "Can emotions be uploaded?", answer: "Emotions are biochemical states; uploading them would require simulating the entire endocrine system and its interaction with neural pathways." },
      { question: "What is the scanning bottleneck?", answer: "Currently, our highest resolution scans require slicing the brain into thin sections, which is destructive and prevents real-time uploading." },
      { question: "Could an uploaded mind feel pain?", answer: "If the simulation is functionally identical to the brain, it would process nociceptive signals and experience the subjective state we call pain." },
      { question: "What is neural lace?", answer: "A conceptual brain-machine interface that integrates with the cortex to allow seamless data transfer and gradual transition to digital substrates." },
      { question: "What happens to the soul?", answer: "Dualists argue the soul is non-physical and cannot be copied, while materialists believe the self is purely the result of physical information processing." },
      { question: "How fast would an uploaded mind think?", answer: "Digital neurons could fire millions of times faster than biological ones, allowing an uploaded consciousness to experience years in seconds." },
      { question: "What is the 'Copy Problem'?", answer: "If a mind can be uploaded, it can be duplicated. This creates multiple 'selves' with identical memories, challenging our legal and ethical concepts of personhood." }
    ],
    5: [ // Simulation Theory
      { question: "Are we in a simulation?", answer: "Nick Bostrom's argument suggests that if civilizations eventually create realistic simulations, the number of simulated worlds would vastly outnumber the real one." },
      { question: "What is the Planck scale limit?", answer: "The discrete nature of reality at the Planck scale might be the 'pixelation' of our universe's underlying computational grid." },
      { question: "What is a base reality?", answer: "Base reality is the original, non-simulated universe that hosts the hardware running all subsequent nested simulations." },
      { question: "What are glitch-like phenomena?", answer: "Quantum entanglement and the observer effect are sometimes cited as computational shortcuts or artifacts in a simulation's engine." },
      { question: "What is the Omega Point?", answer: "A theoretical state where the universe reaches maximum complexity and computational power, potentially simulating all possible realities." },
      { question: "Is reality mathematical?", answer: "Some theorists believe our universe is essentially a mathematical structure, suggesting it functions like software running on a cosmic processor." },
      { question: "What are ancestor simulations?", answer: "These are simulations created by future descendants to study their history, potentially explaining why we find ourselves in this specific time." },
      { question: "What is the simulation argument?", answer: "The philosophical claim that at least one of these is true: humans go extinct before tech maturity, mature civs don't run sims, or we live in a sim." },
      { question: "How do we detect the pixel size?", answer: "Physicists look for limitations in the highest-energy cosmic rays, which should be constrained by the resolution of a simulated lattice." },
      { question: "What is the holographic principle?", answer: "The theory that all the information in our 3D universe is actually encoded on a 2D surface at its boundaries." },
      { question: "Can simulators intervene?", answer: "If simulators exist, they could theoretically pause the simulation, edit parameters, or interact with conscious agents within the system." },
      { question: "What is digital physics?", answer: "The hypothesis that the universe is essentially information and every physical process is a form of computation." }
    ],
    6: [ // Space Travel
      { question: "What is an Alcubierre drive?", answer: "A theoretical propulsion method that contracts space in front of a ship and expands it behind, allowing FTL travel without breaking relativity." },
      { question: "What are solar sails?", answer: "Solar sails use the radiation pressure of starlight to accelerate spacecraft to high speeds without needing onboard fuel." },
      { question: "What is time dilation?", answer: "According to relativity, as an object nears the speed of light, time slows down for it relative to a stationary observer." },
      { question: "What is a generation ship?", answer: "A massive spacecraft where generations of humans live and die while traveling to a distant star system over centuries." },
      { question: "How do wormholes work?", answer: "Wormholes are theoretical bridges through space-time that could connect two distant points, potentially allowing near-instant travel." },
      { question: "What is the rocket equation?", answer: "The Tsiolkovsky equation relates a rocket's change in velocity to its exhaust velocity and the ratio of its initial to final mass." },
      { question: "What is ion propulsion?", answer: "A highly efficient method that accelerates ions with electricity to provide low-thrust, long-duration acceleration in deep space." },
      { question: "What are the dangers of cosmic rays?", answer: "High-energy particles from space that can damage DNA and electronics, requiring heavy shielding for long-duration human spaceflight." },
      { question: "What is gravity assist?", answer: "A maneuver using a planet's orbital velocity to increase or decrease a spacecraft's speed and change its trajectory." },
      { question: "What is an O'Neill cylinder?", answer: "A rotating space station design that provides artificial gravity and large habitable surface areas for human colonies." },
      { question: "What is the Von Neumann probe?", answer: "A theoretical self-replicating spacecraft designed to explore the galaxy by building copies of itself using local resources." },
      { question: "What is nuclear thermal propulsion?", answer: "Using a nuclear reactor to heat a propellant, potentially doubling the efficiency of traditional chemical rockets." }
    ],
    7: [ // Megastructures
      { question: "What is a Dyson Sphere?", answer: "A hypothetical megastructure that completely encompasses a star to capture its entire energy output for an advanced civilization." },
      { question: "What is a Matrioshka brain?", answer: "A massive computer built from multiple nested Dyson Spheres, using the star's energy to power a planet-sized processing unit." },
      { question: "What is a Ringworld?", answer: "A massive artificial ring orbiting a star, providing millions of times the surface area of a planet for habitation." },
      { question: "What is a space elevator?", answer: "A vertical cable extending from Earth's surface into orbit, allowing for low-cost transport of materials into space." },
      { question: "What is an Alderson disk?", answer: "A giant platter-like structure with a star in the middle, offering vast surface area but requiring massive amounts of material." },
      { question: "What is a Shkadov thruster?", answer: "A stellar engine that uses a giant mirror to reflect a star's radiation, slowly moving the entire solar system through space." },
      { question: "What is a Topopolis?", answer: "A tube-like space habitat that loops around a star, providing a continuous internal environment for biological life." },
      { question: "What is a Bernal sphere?", answer: "A rotating spherical space station designed for permanent habitation, providing gravity through centrifugal force." },
      { question: "What is a Stanford torus?", answer: "A donut-shaped rotating space station that can house thousands of residents in an Earth-like environment." },
      { question: "What is a Bishop ring?", answer: "A massive rotating ring habitat that uses carbon nanotubes to allow for a large atmosphere without a ceiling." },
      { question: "What is a Shell World?", answer: "A megastructure consisting of a shell built around a planet, potentially creating multiple habitable layers." },
      { question: "What is a Nicoll-Dyson beam?", answer: "A weaponized Dyson Sphere that focuses a star's energy into a beam capable of destroying distant planetary systems." }
    ],
    8: [ // Mars Colonization
      { question: "Can Mars be terraformed?", answer: "Terraforming Mars involves thickening its atmosphere and warming the planet to allow liquid water and eventually breathable air." },
      { question: "Why is Mars red?", answer: "Mars appears red due to iron oxide, or rust, covering much of its surface and suspended in its thin atmosphere." },
      { question: "Is there water on Mars?", answer: "Evidence shows Mars has significant water ice at its poles and beneath the surface, with occasional brine flows in crater walls." },
      { question: "How long is the trip to Mars?", answer: "With current technology, a one-way trip to Mars takes roughly 6 to 9 months depending on planetary alignment." },
      { question: "What is Mars' gravity?", answer: "Mars has about 38% of Earth's gravity, which would have significant effects on human bone density and muscle mass over time." },
      { question: "What is the Martian atmosphere like?", answer: "It is 95% carbon dioxide and 100 times thinner than Earth's, offering little protection from the cold or UV radiation." },
      { question: "How would settlers get oxygen?", answer: "Settlers could use electrolysis to split Martian water into oxygen or use devices like MOXIE to extract oxygen from CO2." },
      { question: "What are Martian dust storms?", answer: "Mars can experience planet-wide dust storms that last for months, blocking sunlight and coating solar panels in fine grit." },
      { question: "Is there life on Mars today?", answer: "While no direct evidence exists, scientists are searching for microbial life in underground brine pockets or near geothermal vents." },
      { question: "Where should the first colony be?", answer: "Ideal locations are near the equator for sunlight or near ice deposits and lava tubes for resource access and shielding." },
      { question: "What are Martian lava tubes?", answer: "Underground tunnels formed by ancient volcanic activity that could provide natural protection from radiation and meteoroids." },
      { question: "What is Mars' magnetic field?", answer: "Mars lacks a global magnetic field, which allowed the solar wind to strip away most of its original, thicker atmosphere." }
    ],
    9: [ // Neural Links
      { question: "What is a BMI?", answer: "A Brain-Machine Interface allows direct communication between a brain and external devices, potentially restoring lost senses or enhancing cognition." },
      { question: "How does Neuralink work?", answer: "Neuralink aims to use high-bandwidth electrode arrays implanted in the brain to transmit neural signals to computers wirelessly." },
      { question: "What is neural plasticity?", answer: "The brain's ability to reorganize itself by forming new neural connections throughout life, which is critical for BMI integration." },
      { question: "Can we download skills?", answer: "While currently theoretical, high-bandwidth BMIs might one day allow for the direct transfer of information into the human memory cortex." },
      { question: "What are the ethics of BCIs?", answer: "Key concerns include mental privacy, cognitive enhancement equality, and the potential for hacking a human mind." },
      { question: "Can BCIs cure paralysis?", answer: "By bypassing damaged neural pathways, BCIs can allow paralyzed individuals to control robotic limbs or their own muscles with thought." },
      { question: "What is a non-invasive BMI?", answer: "Devices that read brain activity from outside the skull, such as EEG or fNIRS, though they currently have much lower bandwidth than implants." },
      { question: "What is the 'Link'?", answer: "A general term for an implanted device that connects neurons to a digital layer, potentially leading to a 'symbiosis' with AI." },
      { question: "Can BCIs restore vision?", answer: "Yes, by directly stimulating the visual cortex or optic nerve, researchers have restored basic light perception to some blind patients." },
      { question: "How long do brain implants last?", answer: "A major challenge is 'gliosis,' where the brain builds scar tissue around electrodes, eventually degrading the electrical signal." },
      { question: "Can BCIs enable telepathy?", answer: "Theoretically, two individuals with high-bandwidth BCIs could share thoughts and sensory data directly, bypassing the need for speech." },
      { question: "What is mental augmentation?", answer: "Using digital co-processors to handle complex math, language translation, or data retrieval directly within the stream of consciousness." }
    ],
    10: [ // The End of the Universe
      { question: "What is the Heat Death?", answer: "The 'Big Freeze' occurs when the universe expands until heat is evenly distributed, leaving no energy for any work or life." },
      { question: "What is the Big Crunch?", answer: "A theoretical end where gravity eventually halts expansion and pulls everything back into a final singularity." },
      { question: "What is the Big Rip?", answer: "A scenario where dark energy becomes so strong it tears apart galaxies, stars, planets, and eventually atoms themselves." },
      { question: "What is vacuum decay?", answer: "A terrifying possibility where a 'bubble' of lower-energy space-time expands at light speed, rewriting the laws of physics forever." },
      { question: "How long until the end?", answer: "The Big Freeze is expected in roughly 10^100 years, long after the last black holes have evaporated via Hawking radiation." },
      { question: "What is Hawking radiation?", answer: "The slow process by which black holes lose mass over time through quantum effects at their event horizons, eventually evaporating." },
      { question: "What is the Big Bounce?", answer: "A cyclic model where the universe goes through infinite Big Bangs and Big Crunches, with no absolute beginning or end." },
      { question: "What is proton decay?", answer: "If protons are unstable, all matter will eventually fall apart into light and leptons over incredible timescales." },
      { question: "What is the cosmic iron era?", answer: "A far-future state where all matter has fused into iron-56, resulting in a universe filled only with dead iron spheres." },
      { question: "What is a Boltzmann brain?", answer: "A paradox where it is statistically more likely for a conscious brain to spontaneously form from vacuum fluctuations than a whole universe." },
      { question: "What happens to light in the end?", answer: "Photons will eventually redshift until they have infinite wavelength, essentially vanishing as the universe grows cold and empty." },
      { question: "Can life survive the end?", answer: "Technologically advanced civilizations might migrate to black holes to harvest their energy before the final cosmic extinction." }
    ]
  };

  return data[themeId] || [];
};

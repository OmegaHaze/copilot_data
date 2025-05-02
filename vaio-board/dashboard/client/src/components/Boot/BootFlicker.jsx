import { useEffect, useState, useReducer } from 'react'
import { io } from 'socket.io-client'
import CRTEffects from '../Services/CRT-Effects';
// Boot sequence messages that will be displayed one after another
// These lines simulate system startup processes with [OK] status indicators
const postLines = [
  '[OK] Initializing terminal interfaces...',
  '[OK] Loading supervisor service...',
  '[OK] Spawning OpenWebUI backend...',
  '[OK] Mounting ComfyUI pipeline...',
  '[OK] Qdrant vector engine online...',
  '[OK] Engaging n8n automations...',
  '[OK] Terminal bridge established',
  '[OK] Socket connection stable',
  '[OK] Boot sequence complete'
]

// Initial state for visual effects
const initialState = {
  asciiVisible: false, // Shows ASCII VAIO logo
  glitch: false,       // Applies glitch distortion
  glow: false,         // Adds glow effect to text
  burnIn: false,       // Simulates CRT burn-in effect
  crtReveal: false,    // Controls CRT-style reveal animation
  flash: false,        // Creates flash effect
  scanPulse: false,    // Shows horizontal scan lines moving
  explode: false,      // Triggers character explosion animation
  crtRipple: false,    // Controls CRT ripple warp effect
  distorted: false,    // Applies random skew/scale/rotate
  fullscreenStretch: false, // Expands terminal to full screen  
  fullScreenText: false,    // Progressively distorts text
  phase: 'boot',       // Current animation phase ('boot', 'intro', 'glitch', 'explosion')
}

// Reducer function to handle all visual effect state changes
function reducer(state, action) {
  switch (action.type) {
    case 'SET': 
      return { ...state, [action.key]: action.value }
    case 'BATCH': 
      return { ...state, ...action.payload }
    case 'RESET':
      return initialState
    case 'TOGGLE':
      return { ...state, [action.key]: !state[action.key] }
    default: 
      return state
  }
}

export default function BootFlicker({ onComplete }) {
  // Controls the current line being displayed in the boot sequence
  const [step, setStep] = useState(0)
  // Tracks socket connection status for dependency triggering
  const [connected, setConnected] = useState(false)
  // Handles initial flickering effect when first connecting
  const [flickered, setFlickered] = useState(false)
  // NEW: Additional state for edge flicker effect that can be triggered without sound
  const [edgeFlicker, setEdgeFlicker] = useState(true)
  // NEW: Centralized state management for visual effects using reducer
  const [state, dispatch] = useReducer(reducer, initialState)
  // Ripple intensity state - kept separate as it's continuously animated
  const [rippleIntensity, setRippleIntensity] = useState(0)

  /**
   * Custom audio player with strict volume control
   * Loads and plays audio with careful volume management to prevent loud sounds
   * Uses Web Audio API for precise control over playback
   * 
   * @param {string} audioPath - Path to the audio file
   * @param {number} volume - Initial volume level (will be limited for safety)
   * @param {number} playbackRate - Speed of audio playback
   */
  const playAudioWithStrictVolumeControl = (audioPath, volume = 0.05, playbackRate = 1.0) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported in this browser');
        return;
      }
      
      const audioContext = new AudioContext();
      
      fetch(audioPath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.playbackRate.value = playbackRate;
          
          // Two-stage gain node setup for extra volume safety
          const masterGain = audioContext.createGain();
          masterGain.gain.value = Math.min(0.4, volume); // Hard limit at 0.4
          
          const secondaryGain = audioContext.createGain();
          secondaryGain.gain.value = Math.min(0.5, volume * 5); // Secondary volume control
          
          source.connect(secondaryGain);
          secondaryGain.connect(masterGain);
          masterGain.connect(audioContext.destination);
          
          source.start(0);
          console.log(`Playing ${audioPath} with volume ${volume} and playbackRate ${playbackRate}`);
        })
        .catch(err => console.error('Error playing audio with strict volume control:', err));
    } catch (err) {
      console.error('Failed to set up audio context:', err);
    }
  };

  // Play flickering light sound effect when component mounts
  // This creates the ambiance of an old CRT monitor or terminal
  useEffect(() => {
    playAudioWithStrictVolumeControl('/flickeringlight_trimmed.wav', 2.0, 1.0);
  }, []);

  // Set up socket connection and trigger initial flicker effect
  useEffect(() => {
    const socket = io();
    socket.on('connect', () => {
      setConnected(true);
      // Play electrical zap sound on connection
      playAudioWithStrictVolumeControl('/zap_sound.ogg', 0.5, 1.0);
      // Brief flicker effect on connection
      setFlickered(false);
      setTimeout(() => setFlickered(true), 200);
    });
    return () => socket.disconnect();
  }, []);

  // NEW: Add animation frame for ripple effect
  useEffect(() => {
    let animationFrameId;
    let startTime;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Cycle through different ripple intensities
      const intensity = Math.sin(elapsed * 0.01) * 0.5 + Math.sin(elapsed * 0.003) * 0.3;
      setRippleIntensity(intensity);
      
      animationFrameId = requestAnimationFrame(animate);
    };

    if (state.crtRipple) {
      animationFrameId = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [state.crtRipple]);

  // Main effect controlling the boot sequence progression and visual effects
  useEffect(() => {
    // Don't proceed until connected and initial flicker is complete
    if (!connected || !flickered) return
    
    // Activate text distortion effect halfway through boot sequence
    if (step === Math.floor(postLines.length / 2)) {
      dispatch({ type: 'SET', key: 'distorted', value: true });
    }
    
    // Activate fullscreen stretch effect near the end of boot messages
    if (step === postLines.length - 2) {
      dispatch({ type: 'SET', key: 'fullscreenStretch', value: true });
    }

    // Activate progressive text distortion effect partway through
    if (step === 5) {
      dispatch({ type: 'SET', key: 'fullScreenText', value: true });
    }
    
    // If still displaying boot messages, advance to next line after delay
    if (step < postLines.length) {
      const timeout = setTimeout(() => setStep(step + 1), 120)
      return () => clearTimeout(timeout)
    } else {
      // Boot sequence complete - transition to ASCII logo with effects
      dispatch({ type: 'SET', key: 'asciiVisible', value: true });
      
      // Sequence of visual effects with carefully timed delays
      // Creates dramatic reveal of the VAIO logo
      dispatch({ type: 'SET', key: 'glow', value: true }); // Initial glow effect
      setTimeout(() => dispatch({ type: 'SET', key: 'burnIn', value: true }), 1000); // Add burn-in effect after 1s
      
      // NEW: Add CRT ripple effect at 2s instead of crtReveal
      setTimeout(() => dispatch({ type: 'SET', key: 'crtRipple', value: true }), 2000);    
      
      // Play explosion charge sound effect after 3s
      setTimeout(() => {
        playAudioWithStrictVolumeControl('/intro_charge_explosion.wav', 0.1, 0.5);
      }, 3000)
      // Flash effect after 3s
      setTimeout(() => dispatch({ type: 'SET', key: 'flash', value: true }), 3000);
      
      // Edge flicker effect at 3.5s - using the separate edgeFlicker state
      // This won't trigger sound effects since it's not tied to the socket connection
      setTimeout(() => {
        setEdgeFlicker(false);
        setTimeout(() => setEdgeFlicker(true), 200);
      }, 3500);
      
      // Glitch and scan pulse effects after 4s
      setTimeout(() => {
        dispatch({ type: 'BATCH', payload: { glitch: true, scanPulse: true } });
        setTimeout(() => dispatch({ type: 'SET', key: 'scanPulse', value: false }), 400); // Brief scan pulse
      }, 4000);
      
      // Create a growth effect first, then explosion
      setTimeout(() => {
        // Start growing before explosion
        dispatch({ type: 'SET', key: 'glitch', value: false });
        document.querySelector('.ascii-logo-container').classList.add('growing');
        
        // Then explode after very short growth period (300ms)
        setTimeout(() => {
          dispatch({ type: 'SET', key: 'explode', value: true });
        }, 150);
      }, 5000);

      // Notify parent component that boot sequence is complete
      setTimeout(onComplete, 6200);
    }
  }, [step, connected, flickered])

  /**
   * Generates random distortion style for the terminal container
   * Creates realistic CRT distortion with skew, scale, perspective and rotation
   * 
   * @returns {Object} CSS style object with transform properties
   */
  const getDistortionStyle = () => {
    if (!state.distorted) return {};
    
    // Generate random transformation values for distortion effect
    const skewX = Math.random() * 6 - 3;        // Random skew X between -3 and 3 degrees
    const skewY = Math.random() * 4 - 2;        // Random skew Y between -2 and 2 degrees
    const scaleX = 1 + Math.random() * 0.08 - 0.04; // Scale X with slight variation
    const scaleY = 1 + Math.random() * 0.1 - 0.05;  // Scale Y with slight variation
    const perspective = 500 + Math.random() * 200;  // Add perspective effect
    const rotateX = Math.random() * 2 - 1;      // Slight X-axis rotation
    
    return {
      transform: `perspective(${perspective}px) skew(${skewX}deg, ${skewY}deg) scale(${scaleX}, ${scaleY}) rotateX(${rotateX}deg)`,
      transition: 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1.0)', // Smooth easing transition
    };
  };

  /**
   * Generates progressive distortion styles for each line of text
   * Creates increasing distortion as lines progress down the screen
   * 
   * @param {number} lineIndex - Index of the current line
   * @returns {Object} CSS style object with distortion properties
   */
  const getLineDistortionStyle = (lineIndex) => {
    if (!state.fullScreenText) return {};
    
    // Apply increasingly exaggerated effects based on line index
    const scaleX = 1 + (lineIndex * 0.08);          // Horizontal scale increases with each line
    const scaleY = 1 + (lineIndex * 0.15);          // Vertical scale increases faster
    const skewX = (Math.random() * 3 - 1.5) + (lineIndex * 0.5); // Progressive horizontal skew
    const translateX = lineIndex % 2 === 0 ? lineIndex * 5 : -lineIndex * 3; // Alternating left/right shifting
    const brightness = 1 + (lineIndex * 0.1);       // Brightness increases with each line
    
    return {
      transform: `scale(${scaleX}, ${scaleY}) skew(${skewX}deg) translateX(${translateX}px)`,
      filter: `brightness(${brightness})`,           // Increase brightness
      fontSize: `${1.1 + (lineIndex * 0.08)}rem`,    // Progressively larger font
      letterSpacing: `${lineIndex * 0.5}px`,         // Increasing letter spacing
      textShadow: `0 0 ${3 + lineIndex * 2}px rgba(0, 255, 0, ${0.4 + lineIndex * 0.1})`, // Growing green glow
      transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)', // Smooth easing transition
      margin: `${0.5 + lineIndex * 0.3}rem 0`,       // Increasing margin between lines
    };
  };

  /**
   * NEW: Generates CRT ripple warp effect for ASCII logo
   * Creates dynamic rippling and warping of text like on an old CRT screen
   * 
   * @param {number} lineIndex - Index of the current line
   * @param {number} charIndex - Index of the current character
   * @returns {Object} CSS style object with ripple effect properties
   */
  const getCRTRippleStyle = (lineIndex, charIndex) => {
    if (!state.crtRipple) return {};
    
    // Base position for wave calculation
    const baseX = charIndex * 0.08;
    const baseY = lineIndex * 0.12;
    
    // Create complex wave patterns with multiple frequencies
    const wave1 = Math.sin(baseX + (rippleIntensity * 8)) * Math.cos(baseY + (rippleIntensity * 4));
    const wave2 = Math.sin(baseX * 0.5 + (rippleIntensity * 12)) * 0.7;
    const wave3 = Math.cos(baseY * 0.3 + (rippleIntensity * 7)) * 0.3;
    
    // Combined wave effect
    const waveEffect = (wave1 + wave2 + wave3) * 0.8;
    
    // Transform properties based on wave effect
    const translateX = waveEffect * (7 + (charIndex % 3) * 2); // Horizontal shift
    const translateY = waveEffect * (3 + (lineIndex % 2) * 2); // Vertical shift
    const rotate = waveEffect * 5; // Slight rotation
    const scaleX = 1 + waveEffect * 0.15; // Horizontal stretch
    const scaleY = 1 + waveEffect * 0.08; // Vertical stretch
    
    // Random flicker effect
    const randomFlicker = Math.random() > 0.92 ? 'brightness(1.5)' : '';
    
    return {
      display: 'inline-block',
      transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`,
      filter: randomFlicker,
      transition: 'transform 60ms cubic-bezier(0.11, 0.29, 0.18, 0.97)',
    };
  };

  return (
    <div className={`fixed inset-0 crt-text4 font-mono text-sm z-50 flex flex-col items-center justify-center p-6 boot-glow ${flickered ? '' : 'flash-flicker'} ${edgeFlicker ? '' : 'flash-flicker'}`}>
      
      {/* Scanline overlay - creates horizontal CRT scan line effect */}
      <div className="fixed inset-0 z-50 pointer-events-none scanlines" />
      <CRTEffects isActive={true} />

      {/* Scan pulse effect - creates moving horizontal scan line */}
      {state.scanPulse && <div className="fixed inset-0 z-50 pointer-events-none scan-pulse" />}

      {/* Terminal/Boot message display */}
      {!state.asciiVisible && (
        <div 
          className={`${state.fullscreenStretch ? 'fixed inset-0 py-16 px-8 distorted' : 'w-full max-w-xl min-h-64 crt-border-green6 p-4'} 
                      shadow-inner z-40 animate-flicker`}
          style={state.distorted ? getDistortionStyle() : {}}
        >
          {/* Render each boot message line with animation delay */}
          {postLines.slice(0, step).map((line, i) => (
            <div 
              key={i} 
              className={`tracking-wider typing-line ${state.fullScreenText ? 'glitch-flicker' : ''}`}
              style={{ 
                animationDelay: `${i * 150}ms`, // Stagger animation timing
                // Apply different styles based on current effect state
                ...(state.fullScreenText ? getLineDistortionStyle(i) : 
                   state.fullscreenStretch ? {
                     fontSize: `${1.2 + i * 0.05}rem`, // Progressively larger text
                     transform: `scale(${1 + i * 0.03}, 1) translateX(${i % 2 === 0 ? i * 5 : -i * 3}px)`, // Alternating shift
                     margin: '0.8rem 0',
                     textShadow: '0 0 5px rgba(0, 255, 0, 0.7)' // Green glow
                   } : {})
              }}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {/* ASCII Logo Display - VAIO logo with various visual effects */}
      {state.asciiVisible && (
        <div className={`absolute inset-0 flex items-center justify-center ${state.flash ? 'reverse-flash' : ''} z-40 ${state.explode ? 'overflow-visible' : 'overflow-hidden'}`}>
          <pre
            className={`text-center crt-text4 text-base tracking-widest ascii-logo-container
              ${state.glow ? 'glow-pulse' : ''} 
              ${state.burnIn ? 'burn-in' : ''}`}
            style={{
              // Handle both growing and exploding states
              transition: 'all 1s cubic-bezier(0.26, 1.02, 0.98, 1.0)',
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center',
              perspective: '1000px',
              ...(state.explode ? {
                position: 'absolute',
                zIndex: 100,
                width: '100vw',
                height: '100vh',
              } : {})
            }}
          >
            {/* ASCII VAIO logo with CRT ripple warp effect */}
            {[
              "  ██╗   ██╗  █████╗  ██╗  ██████╗   ",
              " ██║   ██║ ██╔══██╗ ██║ ██╔═══██╗ ",
              " ██║   ██║ ███████║ ██║ ██║   ██║ ",
              " ╚██╗ ██╔╝ ██╔══██║ ██║ ██║   ██║ ",
              "   ╚████╔╝  ██║  ██║ ██║ ╚██████╔╝  ",
              "    ╚═══╝   ╚═╝  ╚═╝ ╚═╝  ╚═════╝   ",
            ].map((line, i) => (
              <div 
                key={i} 
                style={{
                  position: 'relative',
                  zIndex: 100,
                  transition: 'transform 0.8s cubic-bezier(0.23, 1.5, 0.32, 1.0)',
                  transformOrigin: 'center center',
                }}
              >
                {/* Split each character for individual ripple and explosion animation */}
                {line.split('').map((char, j) => (
                  <span
                  key={j}
                  className={state.explode ? 'explode-char' : ''}
                  style={
                    state.explode
                      ? {
                          transform: `translate3d(
                            ${(Math.random() * 2 - 1) * window.innerWidth * 0.6}px, 
                            ${(Math.random() * 2 - 1) * window.innerHeight * 0.6}px, 
                            ${Math.random() * 500}px
                          )
                          scale(${2 + Math.random() * 3})
                          rotate3d(${Math.random()}, ${Math.random()}, ${Math.random()}, ${Math.random() * 720}deg)`,
                          opacity: 0,
                          display: 'inline-block',
                          transition: `all ${0.8 + Math.random() * 0.7}s cubic-bezier(0.16, 1, 0.3, 1)`,
                          transitionDelay: `${Math.random() * 200}ms`,
                          filter: 'brightness(2.5) blur(1px)',
                          transformStyle: 'preserve-3d',
                          transformOrigin: 'center center',
                        }
                      : getCRTRippleStyle(i, j)
                  }
                >
                  {char}
                </span>
                
                ))}
              </div>
            ))}
          </pre>
        </div>
      )}
      
      {/* Screen vignette effect - darkens edges to simulate old CRT monitor */}
      {(state.distorted || state.fullscreenStretch) && (
        <div 
          className="fixed inset-0 pointer-events-none z-[51]" 
          style={{
            background: 'radial-gradient(circle at center, transparent 60%, rgba(0, 10, 2, 0.3) 100%)', // Vignette gradient
            boxShadow: 'inset 0 0 100px 20px rgba(0, 0, 0, 0.8)', // Inner shadow for screen edge effect
          }}
        />
      )}

      {/* Add CSS for the growing effect */}
      <style jsx>{`
       .growing {
  animation: grow-fx 0.85s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  will-change: transform, filter;
  backface-visibility: visible;
  transform-style: preserve-3d;
}
@keyframes grow-fx {
  0% {
    transform: scale(1);
    filter: brightness(1.2) drop-shadow(0 0 5px #0f0);
  }
  50% {
    transform: scale(3.2);
    filter: brightness(5.2) drop-shadow(0 0 20px #0f0);
  }
  100% {
    transform: scale(6.4);
    filter: brightness(5.8) drop-shadow(0 0 40px #0f0);
  }
}

      `}</style>
    </div>
  )
}

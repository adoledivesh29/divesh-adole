import React, { useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import b1 from '../../assets/images/projects/b1.png'
import typerium from '../../assets/images/projects/Typerium.png'
import WoodWave from '../../assets/images/projects/WoodWave.png'
import gridMaster from '../../assets/images/projects/grid-master.png'
import mpl from '../../assets/images/projects/mpl.png'
import ShinyText from '../../custom/ShinyText'
import { Edit, Search, Play, Link } from 'lucide-react';
import { useMouse } from '../../hooks/useMouse'
import { useCursor } from '../../contexts/CursorContext';
import projectsData from '../../data/projectsData';

function ProjectStackCard({ project, index, image, setCursorContent, setVariant }) {
    const cardRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ['start end', 'end start'],
    });

    const restingScale = 1 - index * 0.012;
    const overshootScale = restingScale + 0.018;
    const compressedScale = Math.max(0.88, restingScale - 0.055);
    const scale = useSpring(
        useTransform(scrollYProgress, [0, 0.18, 0.25, 0.7, 1], [0.92, overshootScale, restingScale, restingScale, compressedScale]),
        { stiffness: 520, damping: 34, mass: 0.42 }
    );
    const y = useSpring(
        useTransform(scrollYProgress, [0, 0.17, 0.24, 0.72, 1], [120, -12, 0, 0, -30]),
        { stiffness: 560, damping: 36, mass: 0.42 }
    );
    const rotateX = useSpring(
        useTransform(scrollYProgress, [0, 0.18, 0.25, 1], [6, -1.5, 0, 0]),
        { stiffness: 500, damping: 38, mass: 0.42 }
    );
    const opacity = useTransform(scrollYProgress, [0, 0.14, 0.82, 1], [0.35, 1, 1, 0.82]);
    const imageScale = useSpring(
        useTransform(scrollYProgress, [0, 0.18, 0.28, 1], [1.16, 0.985, 1, 1.04]),
        { stiffness: 520, damping: 40, mass: 0.45 }
    );
    const snapLineOpacity = useTransform(
        scrollYProgress,
        [0, 0.16, 0.2, 0.27, 0.35, 1],
        [0, 0, 1, 0.28, 0, 0]
    );

    const openProject = () => {
        window.open(project.projectUrl, '_blank');
    };

    return (
        <motion.article
            ref={cardRef}
            className="project-stack-card cursor-pointer"
            style={{
                '--stack-index': index,
                zIndex: index + 1,
                scale,
                y,
                rotateX,
                opacity,
            }}
            role="link"
            tabIndex={0}
            onClick={openProject}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openProject();
                }
            }}
            onMouseEnter={() => {
                setCursorContent('Visit')
                setVariant('card')
            }}
            onMouseLeave={() => {
                setCursorContent(null)
                setVariant('default')
            }}
        >
            <motion.div className="project-stack-snap-line" style={{ opacity: snapLineOpacity }} />
            <div className="project-stack-glow" />
            <div className="up">
                <motion.img style={{ scale: imageScale }} src={image} alt={project.name} />
            </div>
            <div className="down">
                <span className="project-meta">{project.year}</span>
                <h1>{project.name}</h1>
                <p>{project.description}</p>
                <div className="techStacks">
                    {project.technologies.map((obj) => (
                        <ShinyText key={obj} text={obj} disabled={false} speed={3} className='tech' />
                    ))}
                </div>
            </div>
        </motion.article>
    );
}


export default function Projects() {
    const { setVariant } = useCursor();
    const [mouseState, ref] = useMouse();
    const [cursorContent, setCursorContent] = useState(null);
    const icons = {
        edit: <Edit size={16} />,
        search: <Search size={16} />,
        play: <Play size={16} />,
        link: <Link size={16} />,
    };

    // Map image paths to imported images
    const imageMap = {
        "/src/assets/images/projects/WoodWave.png": WoodWave,
        "/src/assets/images/projects/Typerium.png": typerium,
        "/src/assets/images/projects/b1.png": b1,
        "/src/assets/images/projects/grid-master.png": gridMaster,
        "/src/assets/images/projects/mpl.png": mpl
    };

    return (
        <div className='project-section' ref={ref} id='projects'>
            {mouseState.x !== null && mouseState.y !== null && (
                <div
                    className="fixed pointer-events-none z-50"
                    style={{
                        left: mouseState.x,
                        top: mouseState.y,
                        transform: 'translate(-50%, -50%)',
                    }}>

                    {cursorContent && (
                        <div
                            className="absolute left-6 top-0 text-white px-3 py-1.5 rounded-full whitespace-nowrap flex items-center gap-2 text-sm customPara"
                            style={{
                                animation: 'fadeIn 0.3s ease-out',
                                transform: 'translate(-100%, -50%)'
                            }}>
                            {typeof cursorContent === 'string'
                                ? cursorContent
                                : icons[cursorContent]}
                        </div>
                    )}
                </div>
            )}
            <div className="about-eyebrow-wrap">
                <span className="about-eyebrow">PROJECTS</span>
                <div className="about-top-divider" aria-hidden="true">
                    <span className="about-top-divider__line" />
                    <span className="about-top-divider__spark" />
                    <span className="about-top-divider__line" />
                </div>
            </div>
            <h2 className='project-subTitle'>From concept to code, here are some things I've built recently.</h2>
            <div className='card-wrap'>
                {projectsData.map((project, index) => (
                    <ProjectStackCard
                        key={index}
                        project={project}
                        index={index}
                        image={imageMap[project.imagePath]}
                        setCursorContent={setCursorContent}
                        setVariant={setVariant}
                    />
                ))}
            </div>
        </div>
    )
}

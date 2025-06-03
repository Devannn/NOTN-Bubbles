import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import statsData from './data/stats.json';

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f0f0;
`;

const BubblesContainer = styled.div`
  position: relative;
  width: 80vw;
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SliderContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Slider = styled.input`
  width: 150px;
`;

const Bubble = styled(motion.div)`
  position: absolute;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: ${props => props.color || '#4CAF50'};
  color: white;
  padding: 0px;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const AppName = styled.div`
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
`;

const UserCount = styled.div`
  font-size: 0.8em;
`;

// Add this color mapping object at the top of your file, outside the component
const appColors = {
    'WhatsApp': '#25D366',
    'Facebook': '#1877F2',
    'Instagram': '#E4405F',
    'TikTok': '#000000',
    'YouTube': '#FF0000',
    'Twitter': '#1DA1F2',
    'Snapchat': '#FFFC00',
    'Pinterest': '#E60023',
    'LinkedIn': '#0A66C2',
    'Reddit': '#FF4500',
    // Add default colors for other apps that might come from the API
    'TLS': '#2C3E50',
    'HTTP': '#E74C3C',
    'DNS': '#3498DB',
    'Default': '#95A5A6' // Fallback color for unknown apps
};

const getBubbleSize = (packets) => {
    if (packets < 5) return 80;
    if (packets < 10) return 100;
    if (packets < 15) return 120;
    if (packets < 20) return 140;
    if (packets < 30) return 160;
    if (packets < 40) return 180;
    return 200;
};

const getFontSize = (size) => {
    return `${size * 0.15}px`;
};

const NTOPNG_HOST = "192.168.1.148";
const NTOPNG_PORT = "3000";
const IFID = "1";

const BubbleStats = () => {
    const [stats, setStats] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`http://${NTOPNG_HOST}:${NTOPNG_PORT}/lua/rest/v2/get/host/l7/stats.lua?ifid=${IFID}&host=192.168.1.143`);
                const data = await response.json();

                // Transform the data into the format your component expects
                const transformedStats = Object.entries(data).map(([name, packets], index) => ({
                    id: index + 1,
                    name: name,
                    packets: packets,
                    color: appColors[name] || appColors['Default'] // Use default color if no specific color is defined
                }));

                setStats(transformedStats);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        // Fetch immediately
        fetchStats();

        // Set up polling every 30 seconds
        const interval = setInterval(fetchStats, 30000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    const [positions, setPositions] = useState([]);

    const calculateNewPositions = (currentStats, currentPositions) => {
        const visibleStats = currentStats.filter(stat => stat.packets > 0);
        const newPositions = [...currentPositions];
        const iterations = 50;
        const repulsionStrength = 200;
        const centerAttraction = 0.1;

        const containerWidth = 800;
        const containerHeight = 800;
        const padding = 50;

        // Calculate total packets for the center bubble
        const totalPackets = visibleStats.reduce((sum, stat) => sum + stat.packets, 0);
        const centerBubbleSize = getBubbleSize(totalPackets);

        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < visibleStats.length; i++) {
                let forceX = 0;
                let forceY = 0;
                const sizeI = getBubbleSize(visibleStats[i].packets);

                // Repulsion from center bubble
                const dx = newPositions[i].x - 0; // Center is at (0,0)
                const dy = newPositions[i].y - 0;
                const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
                const minDistanceToCenter = (sizeI + centerBubbleSize) / 2 + 20;

                if (distanceToCenter < minDistanceToCenter) {
                    const force = (minDistanceToCenter - distanceToCenter) / minDistanceToCenter;
                    forceX += (dx / distanceToCenter) * force * repulsionStrength * 1.5; // Stronger repulsion from center
                    forceY += (dy / distanceToCenter) * force * repulsionStrength * 1.5;
                }

                // Repulsion from other visible bubbles
                for (let j = 0; j < visibleStats.length; j++) {
                    if (i !== j) {
                        const sizeJ = getBubbleSize(visibleStats[j].packets);
                        const minDistance = (sizeI + sizeJ) / 2 + 20;

                        const dx = newPositions[i].x - newPositions[j].x;
                        const dy = newPositions[i].y - newPositions[j].y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < minDistance) {
                            const force = (minDistance - distance) / minDistance;
                            forceX += (dx / distance) * force * repulsionStrength;
                            forceY += (dy / distance) * force * repulsionStrength;
                        }
                    }
                }

                // Attraction to center (but not too close)
                const targetDistance = 200; // Desired distance from center
                const currentDistance = Math.sqrt(newPositions[i].x * newPositions[i].x + newPositions[i].y * newPositions[i].y);
                const distanceDiff = currentDistance - targetDistance;
                forceX -= (newPositions[i].x / currentDistance) * distanceDiff * centerAttraction;
                forceY -= (newPositions[i].y / currentDistance) * distanceDiff * centerAttraction;

                // Apply forces
                newPositions[i].x += forceX * 0.1;
                newPositions[i].y += forceY * 0.1;

                // Boundary constraints
                const halfSize = sizeI / 2;
                if (newPositions[i].x - halfSize < -containerWidth / 2 + padding) {
                    newPositions[i].x = -containerWidth / 2 + padding + halfSize;
                }
                if (newPositions[i].x + halfSize > containerWidth / 2 - padding) {
                    newPositions[i].x = containerWidth / 2 - padding - halfSize;
                }
                if (newPositions[i].y - halfSize < -containerHeight / 2 + padding) {
                    newPositions[i].y = -containerHeight / 2 + padding + halfSize;
                }
                if (newPositions[i].y + halfSize > containerHeight / 2 - padding) {
                    newPositions[i].y = containerHeight / 2 - padding - halfSize;
                }
            }
        }

        return newPositions;
    };

    useEffect(() => {
        // Initialize positions in a circle
        const initialPositions = stats.map((stat, index) => {
            const angle = (index / stats.length) * 2 * Math.PI;
            const radius = 150;
            return {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            };
        });
        setPositions(initialPositions);
    }, [stats.length]);

    useEffect(() => {
        if (positions.length > 0) {
            const newPositions = calculateNewPositions(stats, positions);
            setPositions(newPositions);
        }
    }, [stats]);

    const handleSliderChange = (id, value) => {
        setStats(prevStats =>
            prevStats.map(stat =>
                stat.id === id ? { ...stat, packets: parseInt(value) } : stat
            )
        );
    };

    return (
        <Container>
            <BubblesContainer>
                <AnimatePresence>
                    {/* Center Total Packets Bubble */}
                    <Bubble
                        color="#333333"
                        initial={{ scale: 0 }}
                        animate={{
                            scale: 1,
                            width: getBubbleSize(stats.reduce((sum, stat) => sum + stat.packets, 0)),
                            height: getBubbleSize(stats.reduce((sum, stat) => sum + stat.packets, 0)),
                            x: 0,
                            y: 0,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                        }}
                    >
                        <AppName style={{ fontSize: getFontSize(getBubbleSize(stats.reduce((sum, stat) => sum + stat.packets, 0))) }}>
                            Total Packets
                        </AppName>
                        <UserCount style={{ fontSize: getFontSize(getBubbleSize(stats.reduce((sum, stat) => sum + stat.packets, 0))) }}>
                            {stats.reduce((sum, stat) => sum + stat.packets, 0)}
                        </UserCount>
                    </Bubble>
                    {/* Other Bubbles */}
                    {stats
                        .filter(stat => stat.packets > 0)
                        .map((stat, index) => {
                            const size = getBubbleSize(stat.packets);
                            const position = positions[index] || { x: 0, y: 0 };
                            return (
                                <Bubble
                                    key={stat.id}
                                    color={stat.color}
                                    initial={{ scale: 0 }}
                                    animate={{
                                        scale: 1,
                                        width: size,
                                        height: size,
                                        x: position.x,
                                        y: position.y,
                                    }}
                                    exit={{ scale: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20
                                    }}
                                >
                                    <AppName style={{ fontSize: getFontSize(size) }}>
                                        {stat.name}
                                    </AppName>
                                    <UserCount style={{ fontSize: getFontSize(size) * 0.8 }}>
                                        {stat.packets} packets
                                    </UserCount>
                                </Bubble>
                            );
                        })}
                </AnimatePresence>
            </BubblesContainer>
            <SliderContainer>
                {stats.map((stat) => (
                    <div key={stat.id}>
                        <div>{stat.name}</div>
                        <Slider
                            type="range"
                            min="0"
                            max="50"
                            value={stat.packets}
                            onChange={(e) => handleSliderChange(stat.id, e.target.value)}
                        />
                    </div>
                ))}
            </SliderContainer>
        </Container>
    );
};

export default BubbleStats; 
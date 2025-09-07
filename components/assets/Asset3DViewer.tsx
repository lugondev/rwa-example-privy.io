'use client'

import React, {useState} from 'react'
import {Card} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {RotateCcw, Maximize2, Play, Pause} from 'lucide-react'
import Image from 'next/image'

interface Asset3DViewerProps {
	assetType: string
	modelUrl?: string
	className?: string
}

export function Asset3DViewer({assetType, modelUrl, className}: Asset3DViewerProps) {
	const [autoRotate, setAutoRotate] = useState(true)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [currentView, setCurrentView] = useState(0)

	// Mock 3D views for different asset types
	const getAssetViews = () => {
		const baseUrl = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image'

		switch (assetType.toLowerCase()) {
			case 'real estate':
			case 'property':
				return [`${baseUrl}?prompt=modern%20luxury%20apartment%20building%20exterior%20view%20architectural%20photography&image_size=square_hd`, `${baseUrl}?prompt=modern%20luxury%20apartment%20interior%20living%20room%20architectural%20photography&image_size=square_hd`, `${baseUrl}?prompt=modern%20luxury%20apartment%20aerial%20view%20architectural%20photography&image_size=square_hd`]
			case 'art':
			case 'collectible':
				return [`${baseUrl}?prompt=contemporary%20art%20sculpture%20gallery%20display%20professional%20photography&image_size=square_hd`, `${baseUrl}?prompt=contemporary%20art%20sculpture%20close%20up%20detail%20professional%20photography&image_size=square_hd`, `${baseUrl}?prompt=contemporary%20art%20sculpture%20side%20view%20professional%20photography&image_size=square_hd`]
			case 'commodity':
			case 'gold':
				return [`${baseUrl}?prompt=gold%20bars%20stack%20professional%20product%20photography&image_size=square_hd`, `${baseUrl}?prompt=gold%20coins%20collection%20professional%20product%20photography&image_size=square_hd`, `${baseUrl}?prompt=gold%20ingots%20vault%20storage%20professional%20photography&image_size=square_hd`]
			default:
				return [`${baseUrl}?prompt=luxury%20investment%20asset%20professional%20photography&image_size=square_hd`, `${baseUrl}?prompt=premium%20investment%20product%20professional%20photography&image_size=square_hd`, `${baseUrl}?prompt=high%20value%20asset%20professional%20photography&image_size=square_hd`]
		}
	}

	const views = getAssetViews()

	const resetCamera = () => {
		setCurrentView(0)
	}

	const toggleFullscreen = () => {
		setIsFullscreen(!isFullscreen)
	}

	const nextView = () => {
		setCurrentView((prev) => (prev + 1) % views.length)
	}

	// Auto-rotate through views
	React.useEffect(() => {
		if (!autoRotate) return

		const interval = setInterval(() => {
			nextView()
		}, 3000)

		return () => clearInterval(interval)
	}, [autoRotate, views.length])

	return (
		<Card className={`relative overflow-hidden ${className}`}>
			<div className='absolute top-2 right-2 z-10 flex gap-2'>
				<Button variant='outline' size='sm' onClick={resetCamera} className='bg-white/80 backdrop-blur-sm'>
					<RotateCcw className='h-4 w-4' />
				</Button>
				<Button variant='outline' size='sm' onClick={toggleFullscreen} className='bg-white/80 backdrop-blur-sm'>
					<Maximize2 className='h-4 w-4' />
				</Button>
			</div>

			<div className='h-64 w-full relative'>
				<Image src={views[currentView]} alt={`${assetType} view ${currentView + 1}`} fill className='object-cover transition-opacity duration-500' sizes='(max-width: 768px) 100vw, 50vw' />

				{/* View indicators */}
				<div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2'>
					{views.map((_, index) => (
						<button key={index} onClick={() => setCurrentView(index)} className={`w-2 h-2 rounded-full transition-colors ${index === currentView ? 'bg-white' : 'bg-white/50'}`} />
					))}
				</div>
			</div>

			<div className='absolute bottom-2 left-2 z-10'>
				<div className='bg-black/50 text-white px-2 py-1 rounded text-sm'>
					{assetType} View {currentView + 1}/{views.length}
				</div>
			</div>

			<div className='absolute bottom-2 right-2 z-10'>
				<Button variant='outline' size='sm' onClick={() => setAutoRotate(!autoRotate)} className='bg-white/80 backdrop-blur-sm'>
					{autoRotate ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
				</Button>
			</div>
		</Card>
	)
}

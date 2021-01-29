import React,{useState,useEffect} from 'react'
import styled from 'styled-components'
import style from '../../assets/global-style'

const CircleWrapper = styled.div`
    position: relative;
    circle{
        stroke-width: 8px;
        transform-origin: center;
        &.progress-background{
            transform: scale(0.9);
            stroke: ${style['theme-color-shadow']}
        }
        &.progress-bar{
            transform: scale(0.9) rotate(-90deg);
            stroke: ${style['theme-color']}
        }
    }
`

function ProgressCircle(props) {
    const {radius, percent} = props
    const [dashOffset, setDashOffset] = useState(0)
    const dashArray = Math.PI*2*50
    useEffect(()=>{
        setDashOffset((1-percent)*dashArray)
    },[percent,setDashOffset])
    return (
        <CircleWrapper>
            <svg width={radius} height={radius} viewBox="0 0 100 100" version="1.1"  xmlns="http://www.w3.org/2000/svg">
                <circle className="progress-background" r="50" cx="50" cy="50" fill="transparent"></circle>
                <circle className="progress-bar" strokeDasharray={dashArray} strokeDashoffset={dashOffset} r="50" cx="50" cy="50" fill="transparent"></circle>
            </svg>
            {props.children}
        </CircleWrapper>
    )
}

export default React.memo(ProgressCircle)
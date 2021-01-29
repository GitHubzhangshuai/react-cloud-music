import { connect } from "react-redux";
import { PlayListWrapper, ScrollWrapper, ListHeader, ListContent } from './style';
import { CSSTransition } from 'react-transition-group';
import React, { useRef, useState, useCallback } from 'react';
import { prefixStyle, getName, shuffle, findIndex } from './../../../api/utils';
import { changeSequecePlayList, changeCurrentSong, changePlayingState,deleteSong, changeShowPlayList, changeCurrentIndex, changePlayMode, changePlayList } from "../store/actionCreators";
import { playMode } from "../../../api/config";
import Confirm from './../../../baseUI/confirm/index';
import Scroll from '../../../baseUI/scroll';

const transform = prefixStyle ("transform");

function PlayList(props){
    const {
        currentIndex,
        currentSong:immutableCurrentSong,
        showPlayList,
        playList:immutablePlayList,
        mode,
        sequencePlayList:immutableSequencePlayList
    } = props;
    const {
        clearDispatch,
        deleteSongDispatch,
        togglePlayListDispatch,
        changeCurrentIndexDispatch,
        changePlayListDispatch,
        changeModeDispatch,
    } = props;
    const {changeMode} = props
    const confirmRef = useRef();
    const currentSong = immutableCurrentSong.toJS ();
    const playList = immutablePlayList.toJS ();
    const sequencePlayList = immutableSequencePlayList.toJS ();
    const playListRef = useRef()
    const listWrapperRef = useRef()
    const [isShow,setIsShow] = useState(false)
    const onEnterCB = useCallback(()=>{
        setIsShow(true)
        listWrapperRef.current.style[transform] = `translate3d(0,100%,0)`
    },[])
    const onEnteringCB = useCallback(()=>{
        listWrapperRef.current.style['transition'] = 'all .3s'
        listWrapperRef.current.style[transform] = `translate3d(0,0,0)`
    },[])
    const onExitingCB = useCallback(()=>{
        listWrapperRef.current.style['transition'] = 'all .3s'
        listWrapperRef.current.style[transform] = `translate3d(0,100%,0)`
    },[])
    const onExitedCB = useCallback(()=>{
        setIsShow(false)
        listWrapperRef.current.style[transform] = `translate3d(0,100%,0)`
    },[])
    const [canTouch, setCanTouch] = useState(true)
    //touchStart 后记录 y 值
    const [startY, setStartY] = useState (0);
    //touchStart 事件是否已经被触发
    const [initialed, setInitialed] = useState (0);
    // 用户下滑的距离
    const [distance, setDistance] = useState (0);
    const listContentRef = useRef()
    const handleTouchStart = (e) => {
        if(!canTouch||initialed)return
        listWrapperRef.current.style['transition'] = ''
        setStartY(e.nativeEvent.touches[0].pageY)
        // setDistance(0)
        setInitialed(true)
    }
    const handleTouchMove = (e) => {
        if(!canTouch||!initialed)return
        let distance = e.nativeEvent.touches[0].pageY-startY
        if(distance<0)return
        setDistance(distance)
        listWrapperRef.current.style.transform=`translate3d(0,${distance}px,0)`
    }
    const handleTouchEnd = (e) => {
        setInitialed(false)
        if(distance>=150){
            togglePlayListDispatch(false)
        }else{
            listWrapperRef.current.style['transition'] = 'all 0.3s'
            listWrapperRef.current.style[transform] = `translate3d(0,0,0)`
        }
    }
    const handleScroll = (pos) => {
        let state = pos.y === 0
        setCanTouch(state)
    }
    const getCurrentIcon = (item) => {
        // 是不是当前正在播放的歌曲
        const current = currentSong.id === item.id;
        const className = current ? 'icon-play' : '';
        const content = current ? '&#xe6e3;': '';
        return (
            <i className={`current iconfont ${className}`} dangerouslySetInnerHTML={{__html:content}}></i>
        )
    };
    const getPlayMode = () => {
        let content, text;
        if (mode === playMode.sequence) {
            content = "&#xe625;";
            text = "顺序播放";
        } else if (mode === playMode.loop) {
            content = "&#xe653;";
            text = "单曲循环";
        } else {
            content = "&#xe61b;";
            text = "随机播放";
        }
        return (
            <div>
                <i className="iconfont" onClick={(e) => changeMode(e)}  dangerouslySetInnerHTML={{__html: content}}></i>
                <span className="text" onClick={(e) => changeMode(e)}>{text}</span>
            </div>
        )
    };
    const handleDeleteSong = (e,song) => {
        e.stopPropagation()
        deleteSongDispatch(song)
    }
    const handleChangeCurrentIndex = (index) => {
        if (currentIndex === index) return;
        changeCurrentIndexDispatch (index);
    }
    const handleShowClear = () => {
        confirmRef.current.show()
    }
    const handleConfirmClear = () => {
        clearDispatch ();
    }
    return (
        <CSSTransition
        in={showPlayList}
        timeout={300}
        classNames="list-fade"
        onEnter={onEnterCB}
        onEntering={onEnteringCB}
        onExiting={onExitingCB}
        onExited={onExitedCB}
        >
            <PlayListWrapper
            onClick={() => togglePlayListDispatch(false)}
            ref={playListRef}
            style={isShow===true?{display:'block'}:{display: 'none'}}
            >
                <div className="list_wrapper" 
                ref={listWrapperRef} 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd} 
                onClick={e => e.stopPropagation()}>
                    <ListHeader>
                        <h1 className="title">
                            {getPlayMode()}
                            <span className="iconfont clear" onClick={handleShowClear}>&#xe63d;</span>
                        </h1>
                    </ListHeader>
                    <ScrollWrapper>
                        <Scroll
                        ref={listContentRef}
                        onScroll={pos => handleScroll(pos)}
                        bounceTop={false}
                        >
                            <ListContent>
                                {
                                    playList.map((item,index)=>{
                                        return (
                                            <li className="item" key={item.id} onClick={() => handleChangeCurrentIndex(index)}>
                                                {getCurrentIcon(item)}
                                                <span className="text">{item.name}-{getName(item.ar)}</span>
                                                <span className="like">
                                                    <i className="iconfont">&#xe601;</i>
                                                </span>
                                                <span className="delete" onClick={(e) => handleDeleteSong(e,item)}>
                                                    <i className="iconfont">&#xe63d;</i>
                                                </span>
                                            </li>
                                        )
                                    })
                                }
                            </ListContent>
                        </Scroll>
                    </ScrollWrapper>
                </div>
                <Confirm 
                ref={confirmRef}
                text={"是否删除全部？"} 
                cancelBtnText={"取消"} 
                confirmBtnText={"确定"} 
                handleConfirm={handleConfirmClear}
                />
            </PlayListWrapper>
        </CSSTransition>
    )
}
const mapStateToProps = (state) => ({
    currentIndex: state.getIn(['player','currentIndex']),
    currentSong: state.getIn(['player','currentSong']),
    playList: state.getIn(['player','playList']),
    sequencePlayList: state.getIn(['player','sequencePlayList']),
    mode: state.getIn(['player','mode']),
    showPlayList: state.getIn(['player','showPlayList']),
})
const mapDispatchToProps = (dispatch) => {
    return {
        togglePlayListDispatch(data){
            dispatch(changeShowPlayList(data))
        },
        changeCurrentIndexDispatch(data){
            dispatch(changeCurrentIndex(data))
        },
        changeModeDispatch(data){
            dispatch(changePlayMode(data))
        },
        changePlayListDispatch(data){
            dispatch(changePlayList(data))
        },
        deleteSongDispatch(data){
            dispatch(deleteSong(data))
        },
        clearDispatch () {
            // 1. 清空两个列表
            dispatch(changePlayList([]));
            dispatch(changeSequecePlayList([]));
            // 2. 初始 currentIndex
            dispatch(changeCurrentIndex(-1));
            // 3. 关闭 PlayList 的显示
            dispatch(changeShowPlayList(false));
            // 4. 将当前歌曲置空
            dispatch(changeCurrentSong({}));
            // 5. 重置播放状态
            dispatch(changePlayingState(false));
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(React.memo(PlayList));
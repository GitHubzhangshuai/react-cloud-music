import React, { useState, useEffect, useRef, useCallback } from "react";
import { CSSTransition } from "react-transition-group";
import { Container } from "./style";
import { ImgWrapper, CollectButton, SongListWrapper, BgLayer } from "./style";
import Header from "../../baseUI/header/index";
import Scroll from "../../baseUI/scroll/index";
import SongsList from "../SongsList";
import {HEADER_HEIGHT} from '../../api/config'
import { connect } from 'react-redux';
import Loading from "./../../baseUI/loading/index";
import MusicNote from "../../baseUI/music-note/index";
import { getSingerInfo, changeEnterLoading } from "./store/actionCreators";

function Singer(props) {
    const { 
        artist: immutableArtist, 
        songs: immutableSongs, 
        loading,
    } = props;

    const { getSingerDataDispatch } = props;
    const musicNoteRef = useRef();

    const musicAnimation = (x, y) => {
        musicNoteRef.current.startAnimation({ x, y });
    };
    useEffect (() => {
        const id = props.match.params.id;
        getSingerDataDispatch(id);
        // 之前写的 UI 处理逻辑省略
    }, [getSingerDataDispatch,props.match.params.id]);
    const artist = immutableArtist.toJS();
    const songs = immutableSongs.toJS();
    const [showStatus, setShowStatus] = useState(true);
    const collectButton = useRef();
    const imageWrapper = useRef();
    const songScrollWrapper = useRef();
    const songScroll = useRef();
    const header = useRef();
    const layer = useRef();
    // 图片初始高度
    const initialHeight = useRef(0);

    // 往上偏移的尺寸，露出圆角
    const OFFSET = 5;
    const handleScroll = useCallback(pos => {
        let height = initialHeight.current;
        const newY = pos.y;
        const imageDOM = imageWrapper.current
        const buttonDOM = collectButton.current
        const headerDOM = header.current
        const layerDOM = layer.current
        const minScrollY = -(height-OFFSET) + HEADER_HEIGHT
        const percent = Math.abs(newY/height)
        if(newY>0){
            imageDOM.style['transform'] = `scale(${1+percent})`
            buttonDOM.style['transform'] = `translate3d(0,${newY}px,0)`
            layerDOM.style.top = `${height-OFFSET+newY}px`
        }else if(newY >= minScrollY){
            layerDOM.style.top = `${height-OFFSET-Math.abs(newY)}px`
            layerDOM.style.zIndex = 1
            imageDOM.style.paddingTop = '75%'
            imageDOM.style.height = 0
            imageDOM.style.zIndex = -1
            buttonDOM.style['transform'] = `translate3d(0,${newY}px,0)`
            buttonDOM.style['opacity'] = `${1-percent*2}`
        }else if(newY<minScrollY){
            layerDOM.style.top = `${HEADER_HEIGHT-OFFSET}px`
            layerDOM.style.zIndex = 1
            headerDOM.style.zIndex = 100
            imageDOM.style.height = `${HEADER_HEIGHT}px`
            imageDOM.style.paddingTop = 0;
            imageDOM.style.zIndex = 99;
        }
    },[])
    useEffect (() => {
        let h = imageWrapper.current.offsetHeight;
        songScrollWrapper.current.style.top = `${h - OFFSET}px`;
        initialHeight.current = h;
        // 把遮罩先放在下面，以裹住歌曲列表
        layer.current.style.top = `${h - OFFSET}px`;
        songScroll.current.refresh ();
        //eslint-disable-next-line
    }, []);

    const setShowStatusFalse = useCallback (() => {
        setShowStatus (false);
    }, []);
    return (
        <CSSTransition
        in={showStatus}
        timeout={300}
        classNames="fly"
        appear={true}
        unmountOnExit
        onExited={() => props.history.goBack ()}
        >
        <Container>
            { loading ? (<Loading></Loading>) : null}
            <Header title={'头部'} ref={header} handleClick={setShowStatusFalse}></Header>
            <ImgWrapper bgUrl={artist.picUrl} ref={imageWrapper}>
                <div className="filter"></div>
            </ImgWrapper>
            <CollectButton ref={collectButton}>
                <i className="iconfont">&#xe62d;</i>
                <span className="text">收藏</span>
            </CollectButton>
            <BgLayer ref={layer}></BgLayer>
            <SongListWrapper ref={songScrollWrapper}>
                <Scroll ref={songScroll} onScroll={handleScroll}>
                    <SongsList songs={songs} showCollect={false} musicAnimation={musicAnimation}></SongsList>
                </Scroll>
            </SongListWrapper>
            <MusicNote ref={musicNoteRef}></MusicNote>
        </Container>
        </CSSTransition>
    )
}

// 映射 Redux 全局的 state 到组件的 props 上
const mapStateToProps = state => ({
  artist: state.getIn(["singerInfo", "artist"]),
  songs: state.getIn(["singerInfo", "songsOfArtist"]),
  loading: state.getIn(["singerInfo", "loading"]),
});
// 映射 dispatch 到 props 上
const mapDispatchToProps = dispatch => {
  return {
    getSingerDataDispatch(id) {
      dispatch(changeEnterLoading(true));
      dispatch(getSingerInfo(id));
    }
  };
};

// 将 ui 组件包装成容器组件
export default connect(mapStateToProps,mapDispatchToProps)(React.memo(Singer));
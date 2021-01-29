import React, { useRef, useState, useEffect,useCallback } from "react";
import { connect } from "react-redux";
import {
  changePlayingState,
  changeShowPlayList,
  changeCurrentIndex,
  changeCurrentSong,
  changePlayList,
  changePlayMode,
  changeFullScreen,
  changeSpeed
} from "./store/actionCreators";
import { playMode } from '../../api/config';
import {getLyricRequest} from '../../api/request'
import NormalPlayer from './normalPlayer'
import MiniPlayer from './miniPlayer';
import PlayList from './play-list'
import Toast from "./../../baseUI/toast/index";
import Lyric from './../../api/lyric-parser';
import { getSongUrl, isEmptyObject, shuffle, findIndex } from "../../api/utils";

function Player (props) {
    //从props中取redux数据和dispatch方法
    const {
        playing,
        currentSong:immutableCurrentSong,
        currentIndex,
        playList:immutablePlayList,
        mode,//播放模式
        sequencePlayList:immutableSequencePlayList,//顺序列表
        fullScreen
    } = props;
    const {
        togglePlayingDispatch,
        changeCurrentIndexDispatch,
        changeCurrentDispatch,
        changePlayListDispatch,//改变playList
        changeModeDispatch,//改变mode
        toggleFullScreenDispatch,
        togglePlayListDispatch
    } = props;
    const { speed } = props;
    const { changeSpeedDispatch } = props;
    const currentLyric = useRef()
    const currentLineNum = useRef(0);
    const [currentPlayingLyric, setPlayingLyric] = useState("");
    const [modeText, setModeText] = useState("");
    const songReady = useRef(true);
    const toastRef = useRef();
    const playList = immutablePlayList.toJS();
    const sequencePlayList = immutableSequencePlayList.toJS();
    const currentSong = immutableCurrentSong.toJS();
    const clickPlaying = (e, state) => {
        e.stopPropagation();
        togglePlayingDispatch(state);
        if(currentLyric.current){
            currentLyric.current.togglePlay(currentTime*1000)
        }
    };
    const handleLyric = ({lineNum,txt}) => {
        if(!currentLyric.current)return
        currentLineNum.current=lineNum
        setPlayingLyric(txt)
    }
    const getLyric = useCallback(id => {
        let lyric = ''
        if(currentLyric.current){
            currentLyric.current.stop()
        }
        getLyricRequest(id).then(data => {
            console.log(data)
            lyric=data.lrc.lyric
            if(!lyric){
                currentLyric.current=null
                return
            }
            currentLyric.current = new Lyric(lyric,handleLyric,speed)
            currentLyric.current.play()
            currentLineNum.current=0
            currentLyric.current.seek(0)
        }).catch(()=>{
            songReady.current = true
            audioRef.current.play()
        })
    },[])
    useEffect(() => {
        playing ? audioRef.current.play() : audioRef.current.pause();
    }, [playing]);
    const audioRef = useRef();
    //目前播放时间
    const [currentTime, setCurrentTime] = useState(0);
    //歌曲总时长
    const [duration, setDuration] = useState(0);
    //记录当前的歌曲，以便于下次重渲染时比对是否是一首歌
    const [preSong, setPreSong] = useState({});
    //歌曲播放进度
    let percent = isNaN(currentTime / duration) ? 0 : currentTime / duration;
    const onProgressChange = curPercent => {
        const newTime = curPercent * duration;
        setCurrentTime(newTime);
        audioRef.current.currentTime = newTime;
        if (!playing) {
            togglePlayingDispatch(true);
        }
        if(currentLyric.current){
            currentLyric.current.seek(newTime*1000)
        }
    };
    //先mock一份currentIndex
    // useEffect(() => {
    //     changeCurrentIndexDispatch(0);
    // }, [])

    useEffect(() => {
        if (
            !playList.length ||
            currentIndex === -1 ||
            !playList[currentIndex] ||
            playList[currentIndex].id === preSong.id||
            !songReady.current// 标志位为 false
        )
            return;
        let current = playList[currentIndex];
        changeCurrentDispatch(current);//赋值currentSong
        setPreSong(current);
        songReady.current = false; // 把标志位置为 false, 表示现在新的资源没有缓冲完成，不能切歌
        audioRef.current.src = getSongUrl(current.id);
        audioRef.current.autoplay = true;
        // 这里加上对播放速度的控制
        audioRef.current.playbackRate = speed;
        setTimeout(() => {
            audioRef.current.play().then(() => {
                songReady.current = true;
            });
        });
        togglePlayingDispatch(true);//播放状态
        getLyric(current.id);
        setCurrentTime(0);//从头开始播放
        setDuration((current.dt / 1000) | 0);//时长
    }, [speed,getLyric,preSong.id,togglePlayingDispatch,setCurrentTime,setDuration,playList, currentIndex,changeCurrentDispatch,setPreSong]);
    const updateTime = e => {
        setCurrentTime(e.target.currentTime);
        percent = isNaN(currentTime / duration) ? 0 : currentTime / duration;
    };
    //一首歌循环
    const handleLoop = () => {
        audioRef.current.currentTime = 0;
        changePlayingState(true);
        audioRef.current.play();
    };

    const handlePrev = () => {
        //播放列表只有一首歌时单曲循环
        if (playList.length === 1) {
            handleLoop();
            return;
        }
        let index = currentIndex - 1;
        if (index < 0) index = playList.length - 1;
        if (!playing) togglePlayingDispatch(true);
        changeCurrentIndexDispatch(index);
    };

    const handleNext = () => {
        //播放列表只有一首歌时单曲循环
        if (playList.length === 1) {
            handleLoop();
            return;
        }
        let index = currentIndex + 1;
        if (index === playList.length) index = 0;
        if (!playing) togglePlayingDispatch(true);
        changeCurrentIndexDispatch(index);
    };
    const changeMode = () => {
        let newMode = (mode + 1) % 3;
        if (newMode === 0) {
            //顺序模式
            changePlayListDispatch(sequencePlayList);
            let index = findIndex(currentSong, sequencePlayList);
            changeCurrentIndexDispatch(index);
            setModeText("顺序循环");
        } else if (newMode === 1) {
            //单曲循环
            changePlayListDispatch(sequencePlayList);
            setModeText("单曲循环");
        } else if (newMode === 2) {
            //随机播放
            let newList = shuffle(sequencePlayList);
            let index = findIndex(currentSong, newList);
            changePlayListDispatch(newList);
            changeCurrentIndexDispatch(index);
            setModeText("随机播放");
        }
        changeModeDispatch(newMode);
        toastRef.current.show();
    };
    const handleEnd = () => {
        if (mode === playMode.loop) {
            handleLoop();
        } else {
            handleNext();
        }
    };
    const handleError = () => {
        songReady.current = true;
        alert ("播放出错");
    };
    const clickSpeed = (newSpeed) => {
        changeSpeedDispatch (newSpeed);
        //playbackRate 为歌词播放的速度，可修改
        audioRef.current.playbackRate = newSpeed;
        // 别忘了同步歌词
        currentLyric.current.changeSpeed (newSpeed);
        currentLyric.current.seek (currentTime*1000);
    }
    return (
        <div>
            <PlayList changeMode={changeMode}></PlayList>
            { isEmptyObject(currentSong) ? null : 
            <MiniPlayer
                percent={percent}
                song={currentSong}
                fullScreen={fullScreen}
                playing={playing}
                togglePlayList={togglePlayListDispatch}
                toggleFullScreen={toggleFullScreenDispatch}
                clickPlaying={clickPlaying}
            /> 
            }
            { isEmptyObject(currentSong) ? null : 
            <NormalPlayer
                clickSpeed={clickSpeed}
                currentLyric={currentLyric.current}
                currentPlayingLyric={currentPlayingLyric}
                currentLineNum={currentLineNum.current}
                percent={percent}
                song={currentSong}
                fullScreen={fullScreen}
                playing={playing}
                duration={duration}
                currentTime={currentTime}
                onProgressChange={onProgressChange}
                toggleFullScreen={toggleFullScreenDispatch}
                clickPlaying={clickPlaying}
                handlePrev={handlePrev}
                togglePlayList={togglePlayListDispatch}
                handleNext={handleNext}
                mode={mode}
                changeMode={changeMode}
                speed={speed}
            />
            }
            <audio ref={audioRef} onError={handleError} onEnded={handleEnd} onTimeUpdate={updateTime}></audio>
            <Toast text={modeText} ref={toastRef}></Toast>  
        </div>
    )
}

// 映射 Redux 全局的 state 到组件的 props 上
const mapStateToProps = state => ({
  fullScreen: state.getIn(["player", "fullScreen"]),
  playing: state.getIn(["player", "playing"]),
  currentSong: state.getIn(["player", "currentSong"]),
  showPlayList: state.getIn(["player", "showPlayList"]),
  mode: state.getIn(["player", "mode"]),
  currentIndex: state.getIn(["player", "currentIndex"]),
  playList: state.getIn(["player", "playList"]),
  sequencePlayList: state.getIn(["player", "sequencePlayList"]),
  speed: state.getIn(["player", "speed"]),
});

// 映射 dispatch 到 props 上
const mapDispatchToProps = dispatch => {
  return {
    togglePlayingDispatch(data) {
      dispatch(changePlayingState(data));
    },
    toggleFullScreenDispatch(data) {
      dispatch(changeFullScreen(data));
    },
    togglePlayListDispatch(data) {
      dispatch(changeShowPlayList(data));
    },
    changeCurrentIndexDispatch(index) {
      dispatch(changeCurrentIndex(index));
    },
    changeCurrentDispatch(data) {
      dispatch(changeCurrentSong(data));
    },
    changeModeDispatch(data) {
      dispatch(changePlayMode(data));
    },
    changePlayListDispatch(data) {
      dispatch(changePlayList(data));
    },
    changeSpeedDispatch(data) {
      dispatch(changeSpeed(data));
    }
  };
};

// 将 ui 组件包装成容器组件
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(React.memo(Player));
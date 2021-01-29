import React,{useEffect, useState} from 'react'
import Horizen from '../../baseUI/horizen-item'
import Scroll from '../../baseUI/scroll'
import {categoryTypes,alphaTypes} from '../../api/config'
import { 
  NavContainer,
  ListContainer,
  List,
  ListItem
} from "./style";
import {connect} from 'react-redux'
import { 
  getSingerList, 
  getHotSingerList, 
  changeEnterLoading, 
  changePageCount, 
  refreshMoreSingerList, 
  changePullUpLoading, 
  changePullDownLoading, 
  refreshMoreHotSingerList 
} from './store/actionCreators';
import Loading from '../../baseUI/loading';
import {withRouter} from 'react-router-dom';
import { renderRoutes } from 'react-router-config';
import  LazyLoad, {forceCheck} from 'react-lazyload';


function Singers(props){
    const { songsCount } = props;
    let {singerList, enterLoading, pullUpLoading, pullDownLoading, pageCount} = props
    let {getHotSingerDispatch, updateDispatch, pullUpRefreshDispatch, pullDownRefreshDispatch} = props
    let [category, setCategory] = useState('')
    let [alpha, setAlpha] = useState('')
    let handleUpdateAlpha = (val) => {
        setAlpha(val)
        updateDispatch(category,val)
    }
    let handleUpdateCategory = (val) => {
        setCategory(val)
        updateDispatch(val,alpha)
    }
    const handlePullUp = () => {
        pullUpRefreshDispatch(category,alpha,category==='',pageCount)
    }
    const handlePullDown = () => {
        pullDownRefreshDispatch(category,alpha)
    }
    useEffect(()=>{
        if(!singerList.size){
            getHotSingerDispatch()
        }
    },[singerList.size,getHotSingerDispatch])
    const renderSingerList = (singerList) => {
        const enterDetail = (id)  => {
            props.history.push(`/singers/${id}`);
        };
        return (
            <List>
                {
                    singerList.map((item,index)=>{
                        return (
                            <ListItem key={item.accountId+""+index} onClick={() => enterDetail(item.id)}>
                                <div className="img_wrapper">
                                    <LazyLoad placeholder={<img width="100%" height="100%" src={require('./singer.png')} alt="music"/>}>
                                        <img src={`${item.picUrl}?param=300x300`} width="100%" height="100%" alt="music"/>
                                    </LazyLoad>
                                </div>
                                <span className="name">{item.name}</span>
                            </ListItem>
                        )
                    })
                }
            </List>
        )
    }
    return (
        <div>
            <NavContainer>
                <Horizen list={categoryTypes} handleClick={handleUpdateCategory} oldVal={category} title={"分类(默认热门)"}></Horizen>
                <Horizen list={alphaTypes} handleClick={handleUpdateAlpha} oldVal={alpha} title={"首字母"}></Horizen>
            </NavContainer>
            <ListContainer play={songsCount}>
                <Loading show={enterLoading}></Loading>
                <Scroll
                onScroll={forceCheck}
                pullUp={ handlePullUp }
                pullDown = { handlePullDown }
                pullUpLoading = { pullUpLoading }
                pullDownLoading = { pullDownLoading }>
                    {renderSingerList(singerList.toJS())}
                </Scroll>
            </ListContainer>
            { renderRoutes(props.route.routes) }
        </div>
    )
}
const mapStateToProps = (state) => ({
    singerList: state.getIn(['singers','singerList']),
    enterLoading: state.getIn(['singers','enterLoading']),
    pullUpLoading: state.getIn(['singers','pullUpLoading']),
    pullDownLoading: state.getIn(['singers','pullDownLoading']),
    pageCount: state.getIn(['singers','pageCount']),
    songsCount: state.getIn (['player', 'playList']).size,// 尽量减少 toJS 操作，直接取 size 属性就代表了 list 的长度
})

const mapDispatchToProps = (dispatch) => {
    return {
        getHotSingerDispatch(){
            dispatch(getHotSingerList())
        },
        updateDispatch(category,alpha){
            dispatch(changePageCount(0))
            dispatch(changeEnterLoading(true))
            dispatch(getSingerList(category,alpha))
        },
        pullUpRefreshDispatch(category,alpha,hot,count){
            dispatch(changePullUpLoading(true))
            dispatch(changePageCount(count+1))
            if(hot){
                dispatch(refreshMoreHotSingerList())
            }else{
                dispatch(refreshMoreSingerList(category,alpha))
            }
        },
        pullDownRefreshDispatch(category,alpha){
            dispatch(changePullDownLoading(true))
            dispatch(changePageCount(0))
            if(category===''&&alpha===''){
                dispatch(getHotSingerList())
            }else{
                dispatch(getSingerList(category,alpha))
            }
        }
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(React.memo(withRouter(Singers)))
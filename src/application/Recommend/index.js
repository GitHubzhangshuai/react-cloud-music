import React, { useEffect } from 'react'
import Slider from '../../components/slider'
import RecommendList from '../../components/list'
import {Content} from './style'
import Scroll from '../../baseUI/scroll'
import * as actionTypes from './store/actionCreators'
import {connect} from 'react-redux'
import {forceCheck} from 'react-lazyload'
import Loading from '../../baseUI/loading/index'
import {renderRoutes} from 'react-router-config'

function Recommend(props){
    const { songsCount } = props;
    const {bannerList, recommendList,enterLoading} = props
    const {getBannerDataDispatch, getRecommendListDataDispatch} = props
    useEffect(()=>{
      if(!bannerList.size){
        getBannerDataDispatch()
      }
    },[getBannerDataDispatch,bannerList.size])
    useEffect(()=>{
      if(!recommendList.size){
        getRecommendListDataDispatch()
      }
    },[getRecommendListDataDispatch, recommendList.size])
    const bannerListJS = bannerList?bannerList.toJS():[]
    const recommendListJS = recommendList?recommendList.toJS():[]
    return (
        <Content play={songsCount}>
            { enterLoading ? <Loading></Loading> : null }
            <Scroll className="list" onScroll={forceCheck}>
                <div>
                    <Slider bannerList={bannerListJS}></Slider>
                    <RecommendList recommendList={recommendListJS}></RecommendList>
                </div>
            </Scroll>
            {renderRoutes(props.route.routes)}
        </Content>
    )
}
const mapStateToProps = (state) => ({
  bannerList: state.getIn(['recommend','bannerList']),
  recommendList: state.getIn(['recommend','recommendList']),
  enterLoading: state.getIn(['recommend', 'enterLoading']),
  songsCount: state.getIn (['player', 'playList']).size,// 尽量减少 toJS 操作，直接取 size 属性就代表了 list 的长度
})
const mapDispatchToProps = (dispatch) => {
  return {
    getBannerDataDispatch(){
      dispatch(actionTypes.getBannerList())
    },
    getRecommendListDataDispatch(){
      dispatch(actionTypes.getREcommendList())
    }
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(React.memo(Recommend))
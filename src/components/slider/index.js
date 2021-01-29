import React from 'react'
import {SliderContainer} from './style'
import 'swiper/swiper-bundle.css'
import SwiperCore,{Pagination, Autoplay} from 'swiper'
import {Swiper, SwiperSlide} from 'swiper/react'
SwiperCore.use([Pagination,Autoplay])
function Slider(props){
    return (
        <SliderContainer>
            <div className="before"></div>
            <Swiper
            spaceBetween={0}
            slidesPerView={1}
            loop={true}
            pagination={{clickable: true}}
            autoplay={{delay: 2500, disableOnInteraction: false}}
            onSlideChange={()=>console.log('slide change')}
            onSwiper={(swiper)=>console.log(swiper)}
            >
                    {
                        props.bannerList.map((slider,index) => (
                            <SwiperSlide key={index}>
                                <img src={slider.imageUrl} width="100%" height="100%" alt="推荐"/>
                            </SwiperSlide>
                        ))
                    }
            </Swiper>
        </SliderContainer>
    )
}

export default React.memo(Slider)
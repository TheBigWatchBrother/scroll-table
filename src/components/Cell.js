import {useContext, useEffect, useRef, useState} from "react";
import ConfigContext from "./ConfigContext";
import { numbField, tagColorList, currency } from "../utils/formatter";
import {
  Tag,
  TagGroup,
  Checkbox,
  Image,
  Toast,
  Progress,
  Rating
} from "@douyinfe/semi-ui"
import moment from "moment";
import "../style/cell.scss"

const Cell = (props) => {
  const { col, row, index, text } = props
  const {tableComponent, setTableComponent, appHeight, deepConfig} = useContext(ConfigContext)
  const [renderText, setRenderText] = useState('')
  const [scrollFlag, setScrollFlag] = useState(false)
  const cellRef = useRef()
  const textRef = useRef()
  const timer = useRef()

  useEffect(() => {
    getElementByType(col, text, col.type)
  }, [tableComponent]);

  useEffect(() => {
    clearInterval(timer.current)
    return setTextScroll()
  }, [renderText, appHeight]);

  const renderTagList = () => {
    const list = text?.split('，')
    const tagList = list.map((d, i) => {
      return {
        children: d,
        color: tagColorList[i % tagColorList.length]
      }
    })

    setRenderText(
      (
        <TagGroup
          maxTagCount={1}
          tagList={tagList}
          size="small"
          avatarShape="circle"
          style={{
            width: "80%"
          }}
        />
      )
    )
  }

  const getElementByType = async (col, text, type) => {
    switch (type) {
      case 1: // 多行文本  string
      case 99001: // 二维码  string
      case 99005: // 邮箱  string
        return setRenderText(text)
      case 2: // 数字  string
        const numberField = await tableComponent.getField(col.id)
        const numberFormatter = await numberField.getFormatter()
        return text && setRenderText(numbField(numberFormatter, text))
      case 3: // 单选  tag
        return text && setRenderText(
          (
            <Tag size="small" shape="circle" color="green">{text}</Tag>
          )
        )
      case 4: // 多选  tag
        return text && renderTagList()
      case 5: // 日期  date
      case 1001: // 创建时间  date
      case 1002: // 修改时间  date
        const dateField = await tableComponent.getField(col.id)
        const dateFormatter = await dateField.getDateFormat()
        return setRenderText(moment(text).format(dateFormatter.replaceAll('d', 'D')))
      case 7: // 复选框  checkbox
        return setRenderText(
          (
            <Checkbox checked={!!text}/>
          )
        )
      case 11: // 人员  string
      case 1003: // 创建人  string
      case 1004: // 修改人  string
        const str = text?.map(d => d?.name).join('，')
        return setRenderText(str)
      case 13: // 电话  string
        return setRenderText(text)
      case 15: // 超链接  string<a/>
        return setRenderText(
          (
            <a href={'//'+text} target="_blank">{text}</a>
          )
        )
      case 17: // 附件  Attachment
        try {
          const tokenList = text?.map(d => d.token)
          const url = await tableComponent.getCellAttachmentUrls(tokenList, col.id, row.recordId)
          return setRenderText(
            url.map(d => {
              return (
                <Image src={d}/>
              )
            })
          )
        } catch (e) {
          // Toast.error("服务端获取附件数据出错");
          return setRenderText('')
        }
      case 18: // 单向关联
        try {
          const singleResult = typeof text === "object" ? text.text : text
          return setRenderText(singleResult)
        } catch (e) {
          return setRenderText('')
        }
      case 19: // 查找引用
        const lookupFieldId = col.property.refFieldId
        const lookupField = await tableComponent.getField(lookupFieldId)
        const type = await lookupField.getType()
        return getElementByType(col, text, type)
        // return setRenderText('')
      case 20: // 公式
        return setRenderText(text)
      case 21: // 双向关联
        try {
          const doubleResult = typeof text === "object" ? text.text : text
          return setRenderText(doubleResult)
        } catch (e) {
          return setRenderText('')
        }
      case 22: // 地理位置  string
        return text && setRenderText(text.fullAddress)
      case 23: // 群聊  string
        try {
          const group = text?.map(d => d?.name).join('，')
          return setRenderText(group)
        } catch (e) {
          return setRenderText()
        }
      case 1005: // 自动编号  string
        return text && setRenderText(text.value)
      case 99002: // 进度条  string
        const progressField = await tableComponent.getField(col.id)
        const value = await progressField.getValue(row.recordId)
        return text && setRenderText((
          <Progress percent={text*100} showInfo={true} />
        ))
      case 99003: // 货币  string<货币>
        const currencyField = await tableComponent.getField(col.id);
        const currencyFormat = await currencyField.getCurrencyCode()
        const digits = await currencyField.getDecimalDigits()
        return text && setRenderText(`${currency[currencyFormat]}${text.toFixed(digits)}`)
      case 99004: // 评分  rate
        return text && setRenderText((
          <Rating
            disabled
            defaultValue={text}
            size={"small"}
          />
        ))
    }
  }

  const setTextScroll = () => {
    if (deepConfig.overflow_ellipsis) {
      const cellWidth = cellRef.current.clientWidth
      const textWidth = textRef.current.clientWidth
      if (textWidth > cellWidth) {
        setScrollFlag(true)
        const speed = deepConfig.text_speed
        const timeout = 1000 / speed
        let i = 0
        timer.current = setInterval(() => {
          if (cellRef.current) {
            cellRef.current.style.transform = `translateX(${i--}px)`
          }
          if (Math.abs(i) >= textWidth + 10) {
            i = 0
          }
        }, timeout)
      } else {
        setScrollFlag(false)
        cellRef.current.style.transform = '0px'
      }
    }
  }

  return (
    <div className="width-full" ref={cellRef}>
      <p className="inline-block" ref={textRef} style={{width: 'fit-content'}}>
        {renderText}
      </p>
      {deepConfig.overflow_ellipsis && scrollFlag
        && (
          <p className="inline-block pl-10" style={{width: 'fit-content'}}>
            {renderText}
          </p>
        )}
    </div>
  )
}

export default Cell
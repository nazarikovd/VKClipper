import React, { useState } from 'react'
import {
  Group,
  FormLayoutGroup,
  FormItem,
  Button,
  FormStatus,
  Input,
  Progress,
  Header,
  ToolButton,
  Image,
  SimpleGrid,
  ContentBadge,
  useAdaptivityWithJSMediaQueries,
  SubnavigationButton,
  SubnavigationBar,
  Box,
  Counter,
  Flex,
} from '@vkontakte/vkui'
import { Icon16Search, Icon20CopyOutline, Icon20CheckCircleOn, Icon20LinkCircleOutline } from '@vkontakte/icons'

const TikTokScrap = ({ api }) => {
  const [tag, setTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [videos, setVideos] = useState([])
  const [selected, setSelected] = useState([])
  const {viewWidth} = useAdaptivityWithJSMediaQueries();

  const open = (videoId) => {
    window.open(`https://tiktok.com/share/video/${videoId}`, "_blank", "noopener,noreferrer");
  }

  const toggleSelect = (videoId) => {
    setSelected(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId) 
        : [...prev, videoId]
    )
  }

  const handleCopy = () => {
    const clipdata = `https://tiktok.com/share/video/${selected.join("\nhttps://tiktok.com/share/video/")}`
    navigator.clipboard.writeText(clipdata)
    setSelected([])
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setVideos([])

    try {
      if (!tag.trim()) throw new Error('Введите тег для поиска')
      
      const cleanTag = tag.replace(/^#/, '')
      const response = await api.call('links.getByTag', { tag: cleanTag })

      if (!response?.links || !Array.isArray(response.links)) {
        throw new Error('Ошибка при получении данных')
      }

      setVideos(response.links)
    } catch (err) {
      setError(err.message || 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    
    {selected.length > 0 && (

      <Flex justify="center">
        <Box position="fixed" style={{zIndex: 1000}} insetBlockEnd={viewWidth < 4 ? ("5%") : ("1%")}>
          <SubnavigationBar>
            <SubnavigationButton mode="primary" appearance="accent" selected size="l" onClick={() => handleCopy(selected)}
              before={<Icon20CopyOutline/>}
              after={
                <Counter size="s">{selected.length}</Counter>
              }
            >
              Скопировать
            </SubnavigationButton>
          </SubnavigationBar>
        </Box>
      </Flex>

    )}

    <Group header={<Header size="s">Парсинг видео с хештега</Header>}>
      <FormLayoutGroup>
        {error && (
          <FormItem>
            <FormStatus title="Ошибка" mode="error">
              {error}
            </FormStatus>
          </FormItem>
        )}
        <FormItem top="Тег для поиска">
            <Input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="random"
                disabled={loading}
                before="#"
            />
        </FormItem>
        <FormItem>
          <Button size="l" stretched onClick={handleSubmit} disabled={loading || !tag.trim()} before={!loading && <Icon16Search />}>
            {loading ? 'Ищем...' : 'Найти видео'}
          </Button>
        </FormItem>
        {loading && <FormItem><Progress /></FormItem>}
      </FormLayoutGroup>
    </Group>

      {videos.length > 0 && (

        <Group header={<Header size="s">Результаты: {videos.length}</Header>}>
          <SimpleGrid gap="m" columns={Math.min(viewWidth, 3)}>

            {videos.map((item) => {

              const videoId = item.video.id 
              const isSelected = selected.includes(videoId)

              return (
                <Image 
                  onClick={() => toggleSelect(videoId)}
                  borderRadius="l"
                  filter={isSelected ? "opacity(30%) blur(5px)" : ""}
                  style={{ 
                      width: '100%', 
                      aspectRatio: '9 / 16',
                  }}
                  heightSize={340}
                  objectFit="cover"
                  src={item.video.dynamicCover}>

                  <Image.FloatElement placement="center" inlineIndent="s" blockIndent="s">

                    {isSelected && (

                        <ToolButton
                          mode="primary" 
                          IconCompact={Icon20CheckCircleOn}
                          IconRegular={Icon20CheckCircleOn}
                          direction="column"
                        >
                        Выбрано
                        </ToolButton>
                    )}

                  </Image.FloatElement>

                  <Image.FloatElement placement="bottom-start" inlineIndent="s" blockIndent="s">
                    <ContentBadge mode="primary" appearance="overlay">
                      {item.video.duration} сек
                    </ContentBadge>
                  </Image.FloatElement>
                  <Image.FloatElement placement="bottom-end" inlineIndent="s" blockIndent="s">
                    <ToolButton 
                      mode="secondary" 
                      appearance="neutral"
                      IconCompact={Icon20LinkCircleOutline}
                      IconRegular={Icon20LinkCircleOutline}
                      onClick={(e) => {
                        e.stopPropagation()
                        open(item.video.id)
                      }}
                    >
                      Открыть
                    </ToolButton>
                  </Image.FloatElement>
                </Image>
              )

            })}

          </SimpleGrid>
        </Group>

      )}
      
    </>
  )
}

export default TikTokScrap
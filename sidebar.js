import React, { Fragment } from 'react'
import $ from 'jquery'
import DownloadButton from '../../DownloadButton'
import styled from 'styled-components'
import { media, OnlyDesktop } from '../../styles'
import sidebar from '../sidebar'
import startCase from 'lodash.startcase'
import Preloader from '../../Preloader/Preloader'

const EXTENSION_SEPARATOR = '.'
const FOLDER_SEPARATOR = '/'
const SIDE_BAR_HTML_ID = 'sidebar-menu'

// TODO: перенести в хелпер в отдельный файл 
class Helper {
  static getParentFolder (file, section) {
    return file.folder ? file.folder : section.folder
  }

  static extractFilename(file) {
    typeof file === 'string' ? file : file.indexFile
  }

  static removeExtensionFromFileName(filename) {
    //return filename.slice(0, -3)
    return filename.split(EXTENSION_SEPARATOR).slice(0, -1).join(EXTENSION_SEPARATOR)
  }

  static hasChildrenFiles(file) {
    return file.files && file.files.length > 0
  }

  static getFullPath(folder, file) {
    return [folder, file].join(FOLDER_SEPARATOR)
  }

  static fillFilesArray(file, section, arr) {
    const folder = Helper.getParentFolder(file, section)
    const filename = Helper.extractFilename(file)
    const path = Helper.getFullPath(folder, filename)
    arr[path] = startCase(Helper.removeExtensionFromFileName(filename))
  }

  static isFileInArray(array, folder, currentFile) {
    let flag = false
    array.forEach(elem => {
      const path = Helper.getFullPath(folder, elem)
      flag = flag || path === currentFile
    })
    return flag
  }

  static toBooleanString(value) {
    // return !!value ? 'true' : 'false'
    return (!!value).toString()
  }
}

export default class SidebarMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      names: [],
      loading: true
    }
  }

  collapse = () => {
    // (возможно)Нет необходимости в вызове setTimeout
    // Пояснить цель вызова сеттаймаут
    setTimeout(function() {
      $('[data-open=true]').slideDown()
      $('[data-open=false]').slideUp()
    })
  }

  getNamesArr = () => {
    let names = {}
    sidebar.map(section => {
      section.files.map(file => {
        Helper.fillFilesArray(file, section, names)
        if (Helper.hasChildrenFiles(file)) {
          file.files.map(childFile => {
            Helper.fillFilesArray(childFile, names)
          })
        }
      })
    })
    this.setState({
      names,
      loading: false
    })
  }

  componentDidMount = () => {
    this.collapse()
    this.getNamesArr()
  }

  getName = (labels = null, files = null, folder = null, indexFile = null) => {
    let name
    if (labels && labels[indexFile]) {
      name = labels[indexFile]
    } else {
      const path = Helper.getFullPath(folder, indexFile)
      name = this.state.names[path]
    }
    return name
  }

  componentWillReceiveProps = (nextProps) => {
    let con1 = nextProps.currentFile !== this.props.currentFile
    let con2 = nextProps.currentSection !== this.props.currentSection
    if (con1 || con2) {
      this.collapse()
    }
  }

  renderSections = () => {
    const { sidebar } = this.props
    return sidebar.map((section, index) => {
      return this.renderSection(section, index)
    })
  }

  // TODO: вынести в отдельный компонент
  renderSection = (section, sectionIndex) => {
    const { currentSection, getLinkHref, onSectionSelect } = this.props
    const isSectionActive = currentSection === sectionIndex
    let sectionTitle = section.name || this.getName(section.labels, section.files, section.folder, section.indexFile)
    return (
      <div key={sectionIndex}>
        <SectionLink
          level={1}
          href={getLinkHref(sectionIndex)}
          onClick={e => onSectionSelect(e, sectionIndex)}
          className={isSectionActive ? 'docSearch-lvl0' : ''}
          isActive={isSectionActive}
        >
          {sectionTitle}
        </SectionLink>
        <Collapse data-open={Helper.toBooleanString(isSectionActive)}>
          {section.files &&
            section.files.map((file, fileIndex) => {
              return this.renderSectionFile(sectionIndex, file, fileIndex, section)
            })}
        </Collapse>
      </div>
    )
  }

  // TODO: вынести в отдельный компонент
  renderSectionFile = (sidebarIndex, file, fileIndex, section) => {
    const { getLinkHref, onFileSelect, currentFile } = this.props
    const subgroup = file.files || null
    const folderPath = Helper.getFullPath(file.folder, file.indexFile)
    const sectionPath = Helper.getFullPath(section.folder, file)
    const compare = file.folder && file.indexFile ? folderPath : sectionPath
    const isFileActive = currentFile === compare
    const FileOrSubsectionTitle = file.name || this.getName(section.labels, section.files, file.folder || section.folder, file.indexFile || file)
    const isOpen = Helper.isFileInArray(subgroup, file.folder || section.folder, currentFile)
    const openAttr = Helper.toBooleanString(isOpen)
    return (
      <Fragment key={`file-${fileIndex}`}>
        <div>
          <SectionLink
            level={2}
            href={getLinkHref(sidebarIndex, null, file.indexFile)}
            onClick={e =>
              onFileSelect(e, sidebarIndex, null, fileIndex)
            }
            isActive={isFileActive}
          >
            {FileOrSubsectionTitle}
          </SectionLink>
        </div>
        {subgroup && (
          <Collapse
            data-flag={'first'}
            data-open={openAttr}
          >
            {subgroup.map((subFile, subIndex) => {
              return this.renderSubgroup(sidebarIndex, section, file, fileIndex, subFile, subIndex)
            })}
          </Collapse>
        )}
      </Fragment>
    )
  }

  // TODO: вынести в отдельный компонент
  renderSubgroup = (sidebarIndex, section, file, fileIndex, subFile, subIndex) => {
      const { getLinkHref, onFileSelect, currentFile } = this.props
      const fileFolder = file.folder || section.folder
      const subFilePath = Helper.getFullPath(fileFolder, subFile)
      return (
        <div key={`file-${fileIndex}-${subIndex}`}>
          <SectionLink
            level={3}
            href={getLinkHref(
              sidebarIndex,
              subFile,
              fileIndex
            )}
            onClick={e =>
              onFileSelect(
                e,
                sidebarIndex,
                subFile,
                fileIndex
              )
            }
            isActive={currentFile === subFilePath}
          >
            {this.getName(
              file.labels,
              file.files,
              file.folder || section.folder,
              subFile
            )}
          </SectionLink>
        </div>
      )
    
  }

  renderLoadingMenu = () => {
    return (
      <Menu id={SIDE_BAR_HTML_ID}>
        <div style={PreloaderContainer}>
          <Preloader size={24} />
        </div>
      </Menu>
    )
  } 
  
  renderLoadedMenu = () => {
    return (
      <Menu id={SIDE_BAR_HTML_ID}>
        <Sections>
          <SectionLinks>
            {this.renderSections()}
          </SectionLinks>
        </Sections>
        <OnlyDesktop>
          <SideFooter>
            <DownloadButton openTop />
          </SideFooter>
        </OnlyDesktop>
      </Menu>
    )
  }

  render = () => {
    const { loading } = this.state
    return loading ? this.renderLoadingMenu() : this.renderLoadedMenu()
  }
}
const PreloaderContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flexDirection: 'column',
  margin: '44px 34px 0 0'
}
const Menu = styled.div`
  position: sticky;
  top: 60px;
  width: 100%;
  height: calc(100vh - 138px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  ${media.phablet`
    width: auto;
    position: relative;
    margin: 0;
    top: 0;
    overflow-y: auto;
    margin-left: 20px;
  `};
`
const Sections = styled.div`
  margin-bottom: 25px;
  margin-top: 10px;
  min-width: 280px;
`
const SectionLinks = styled.div`
  @media (max-width: 768px) {
    position: relative;
  }
`
const SectionLink = styled.a`
  display: block;
  position: relative;
  font-size: 18px;
  font-weight: 500;
  color: #b0b8c5;
  text-decoration: none;
  font-weight: 400;
  line-height: 26px;
  min-height: 26px;
  padding-bottom: 5px;
  padding-left: 15px;
  cursor: pointer;
  margin: 0;
  &:hover {
    color: #3c3937;
  }
  &::before {
    content: '';
    display: block;
    position: absolute;
    width: 8px;
    height: 5px;
    background: url('/static/img/triangle_dark.svg') no-repeat center center;
    left: 0px;
    top: 10px;
    ${props =>
      props.isActive &&
      `
      transform: rotate(-90deg);
    `};
  }
  ${props =>
    props.level === 1 &&
    `
    margin-left: 5px;
  `} ${props =>
    props.level === 2 &&
    `
    margin-left: 30px;
  `};
  ${props =>
    props.level === 3 &&
    `
    margin-left: 45px;
    &::before {
      display: none;
    }
  `};
  ${props =>
    props.isActive &&
    `
    color: #40364d;
	`};
`
const Collapse = styled.div`
  display: none;
`
const SideFooter = styled.div`
  margin-top: 30px;
  padding-bottom: 30px;
`
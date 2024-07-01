import "./App.scss";
import Left from "./components/Left";
import Right from "./components/Right";
import config from "./components/config";
import {useEffect, useRef, useState} from "react";
import {commonInfo, getDataSource} from "./components/const";
import ConfigContext from "./components/ConfigContext";
import {dashboard, base, bitable} from "@lark-base-open/js-sdk";
import {my_plat} from "./utils/computed";

function App() {
  const [deepConfig, setDeepConfig] = useState(config);
  const [dataSource, setDataSource] = useState([]); // 数据源下拉
  const [allFields, setAllFields] = useState([]);
  const appRef = useRef()
  const [appHeight, setAppHeight] = useState(0);
  const [mainTheme, setMainTheme] = useState('LIGHT')


  commonInfo.appRef = appRef

  const state = dashboard.state

  useEffect(() => {
    getConfig().then(async (config) => {
      getTheme()
      getDataSource().then((res) => {
        setDataSource(res)
        setAllFields(config ? config.all_fields : deepConfig.all_fields)
      });
      setAppHeight(appRef.current.offsetHeight)
      window.addEventListener('resize', () => {
        setAppHeight(appRef.current.offsetHeight);
      })
    })

    if (dashboard.state === 'View' || dashboard.state === 'FullScreen') {
      dashboard.onDataChange((e) => {
        getConfig().then(async (config) => {
          getDataSource().then((res) => {
            setDataSource(res)
            setAllFields(config ? config.all_fields : deepConfig.all_fields)
          });
          setAppHeight(appRef.current.offsetHeight)
          window.addEventListener('resize', () => {
            setAppHeight(appRef.current.offsetHeight);
          })
        })
      })
    }
  }, []);

  const getTheme = async () => {
    const theme = await bitable.bridge.getTheme();
    setTheme(theme)
    await bitable.bridge.onThemeChange((event) => {
      setTheme(event.data.theme)
    });
  }

  const setTheme = (theme) => {
    setMainTheme(theme)
    const body = document.body;
    if (theme === 'LIGHT') {
      body.removeAttribute('theme-mode');
    } else {
      body.setAttribute('theme-mode', 'dark');
    }
  }

  const getConfig = async () => {
    return new Promise(async (resolve, reject) => {
      if (dashboard.state === 'View' || dashboard.state === 'FullScreen' || dashboard.state === 'Config') {
        const config = (await dashboard.getConfig()).customConfig
        setDeepConfig(config)
        resolve(config)
      } else {
        resolve()
      }
    })
  }

  return (
    <div id="app-box" ref={appRef}>
      <ConfigContext.Provider value={{deepConfig, setDeepConfig, appHeight, setAppHeight, mainTheme, setMainTheme}}>
        <Left
          deepConfig={deepConfig}
        />
      </ConfigContext.Provider>
      { state === 'Config' || state === 'Create'
        ? (
          <ConfigContext.Provider value={{deepConfig, setDeepConfig, mainTheme, setMainTheme}}>
            <Right
              dataSource={dataSource}
              allFields={allFields}
            />
          </ConfigContext.Provider>
        )
        : ''
      }
    </div>
  );
}

export default App;
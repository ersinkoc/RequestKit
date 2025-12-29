import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import GettingStarted from './pages/docs/GettingStarted'
import ClientInstance from './pages/docs/ClientInstance'
import HttpMethods from './pages/docs/HttpMethods'
import Interceptors from './pages/docs/Interceptors'
import RetryLogic from './pages/docs/RetryLogic'
import ErrorHandling from './pages/docs/ErrorHandling'
import ReactHooks from './pages/docs/ReactHooks'
import ApiReference from './pages/docs/ApiReference'
import Examples from './pages/Examples'
import Playground from './pages/Playground'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="docs/getting-started" element={<GettingStarted />} />
        <Route path="docs/client-instance" element={<ClientInstance />} />
        <Route path="docs/http-methods" element={<HttpMethods />} />
        <Route path="docs/interceptors" element={<Interceptors />} />
        <Route path="docs/retry-logic" element={<RetryLogic />} />
        <Route path="docs/error-handling" element={<ErrorHandling />} />
        <Route path="docs/react-hooks" element={<ReactHooks />} />
        <Route path="docs/api-reference" element={<ApiReference />} />
        <Route path="examples" element={<Examples />} />
        <Route path="playground" element={<Playground />} />
      </Route>
    </Routes>
  )
}

export default App

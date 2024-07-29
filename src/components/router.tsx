import type { Location } from "@remix-run/router";

import {
    useLocation,
    useNavigate,
    useParams,
    NavigateFunction
  } from "react-router-dom";
  
  export function withRouter(Component : any) {
    function ComponentWithRouterProp(props : any) {
      let location : Location = useLocation();
      let navigate : NavigateFunction= useNavigate();
      let params = useParams();
      return (
        <Component
          {...props}
          {...{ location, params, navigate }}
        />
      );
    }
  
    return ComponentWithRouterProp;
  }

  
  export interface PathProps {
      navigate: NavigateFunction,
      location: Location,
      params: any
  }
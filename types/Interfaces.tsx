export interface Route {
    route: string;
    bound: string;
    service_type: string;
    orig_en: string;
    orig_tc: string;
    orig_sc: string;
    dest_en: string;
    dest_tc: string;
    dest_sc: string;
}

export interface OriginRouteETA {
    co: string;
    route: string;
    dir: string;
    service_type: number;
    seq: number;
    dest_tc: string;
    dest_sc: string;
    dest_en: string;
    eta_seq: number;
    eta: string;
    rmk_tc: string;
    rmk_sc: string;
    rmk_en: string;
    data_timestamp: string;
}

export interface MergedRouteETA {
    co: string;
    route: string;
    dir: string;
    service_type: number;
    seq: number;
    dest_tc: string;
    dest_sc: string;
    dest_en: string;
    eta_seq_list: ETASquence[];
    data_timestamp: string;
    route_stop?: RouteStop;
    stop_info?: StopInfo;
}

export interface ETASquence {
    eta_seq: number;
    eta: string;
    rmk_tc: string;
    rmk_sc: string;
    rmk_en: string;
}

export interface RouteStop {
    route: string;
    bound: string;
    service_type: string;
    seq: string;
    stop: string;
}

export interface StopInfo {
    stop: string;
    name_en: string;
    name_tc: string;
    name_sc: string;
    lat: string;
    long: string;
}

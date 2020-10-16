import Axios, { Method } from "axios";
import { has, get, isArray, attempt, join } from "lodash";
import { cancel } from "../components/shared/Charts/commonAxiosFlaged";

const CancelToken = Axios.CancelToken;
const source = CancelToken.source();
export default class commonAxiosRequest {
    method: string;
    urlForRequest: any;
    response: any;
    formData: any;
    cancelReference: Array<any>;
    result: any | [];
    axiosMetod: any = {
        get: Axios.get,
        delete: Axios.delete,
        head: Axios.head,
        post: Axios.post,
        put: Axios.put,
        patch: Axios.patch
    };
    constructor({
        url,
        MethoD,
        formData
    }: {
        url: string | Array<string>;
        MethoD?: Method;
        formData?: any;
    }) {
        this.method = MethoD ? MethoD : "get";
        this.urlForRequest = url;
        this.formData = formData;
        this.cancelReference = [];

        try {
            if (isArray(this.urlForRequest)) this.AxiosInAll();
            if (!isArray(this.urlForRequest)) this.AxiosSingle();
        } catch (e) {
            return e;
        }
    }
    /*
          For Single Request  
      */
    AxiosSingle = (): void =>
        (this.response = this.ArrayofFun(
            this.axiosMetod[this.method.toLowerCase()],
            this.urlForRequest,
            this.formData
        ));
    /*
          For More Than One Request  
      */
    AxiosInAll = (): void => {
        let allRequest = this.urlForRequest.map(urls =>
            this.ArrayofFun(
                this.axiosMetod[this.method.toLowerCase()],
                urls,
                this.formData
            )
        );
        this.response = Axios.all(allRequest);
    };
    /*
          Make Executor Function for execution 
      */
    ArrayofFun = (axiosIn: Function, urls, formData) =>
        axiosIn(urls, formData, {
            cancelToken: new CancelToken(cancel => this.cancelReference.push(cancel))
        });
    /*
          Get Current Result fetch by Ajax 
      */
    getResult = async () => {
        if (isArray(this.urlForRequest)) {
            let combind = [];
            await this.response.then(r => {
                combind = r.map(eachResponse => {
                    return this.valiDataFetchData(eachResponse);
                });
            });
            return (this.result = combind);
        }
        if (!isArray(this.urlForRequest)) {
            return this.result = await this.response.then(r => this.valiDataFetchData(r)
            ).catch((e) => this.valiDataFetchCatch(e));

        }
    };
    valiDataFetchCatch = response => {
        let Data, Message, Error, Cancel;
        if (get(response, "response.data.StatusCode") === 500) {
            Error = true;
            Message = get(response, "response.data.Messages");
        }
        if (get(response, "response.data.StatusCode") === 403) {
            Error = true;
            Message = get(response, "data.Messages");
        }
        Message = isArray(Message) ? join(Message) : Message;
        return { Data, Message, Error, Cancel };
    };
    /*
         Validate Your request Data 
     */
    valiDataFetchData = response => {
        let Data, Message, Error, Cancel;

    switch (get(response, "data.StatusCode")) {
      case 200:
        Data = get(response, "data.Data");
        Message = get(response, "data.Messages");
        break;
      case 405:
        Error = true;
        Message = get(response, "data.Messages");
        break;
      case 400:
        Error = true;
        Message = get(response, "data.Messages");
        break;
      case 415:
        Error = true;
        Message = get(response, "data.Messages");
        break;
      case 403:
        Error = true;
        Message = get(response, "data.Messages");
        break;
      default:
        Error = true;
        if(has(response, "data.Messages")){
          Message = get(response, "data.Messages");
          
        }else{
          Message =  "An unknown issue occurred";
        }
        break;
      }
      if (isArray(Message)) {
          Message = join(Message);
      }
      
    return { Data, Message, Error, Cancel };
  };
  /*
       Cancel All Request current Object  
   */
  cancelAllRequest = (): void => {
    if (isArray(this.cancelReference) && this.cancelReference.length > 0) {
      this.cancelReference.map(r => attempt(r));
    }
  };
}

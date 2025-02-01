import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  constructor(private http: HttpClient) {}

  private url = 'http://kookurbe.ap-south-1.elasticbeanstalk.com';
  private url_local = 'http://localhost:5000';
    
   
  uploadVideo(file: any, moods:string, tags: string):void {
    // const file = event.target.files[0];
    const fileName = file.name;
    const videoData = { moods: moods, tags: tags };

    this.http.post(`${this.url}/uploadUrl?filename=${fileName}`,videoData, { responseType: 'text' })
      .subscribe((res: string) => {
      
     this.http.put(res,file,{headers: {'Content-Type': 'video/mp4'}})
      .subscribe(() => {
        console.log("Video uploaded successfully!");
      }, (error) => {
        console.error("Error uploading video to S3:", error);
      });
    });
  }

  getVideoUrls(tags:string, moods:string): Observable<string[]>  {
    return this.http.get<string[]>(`${this.url}/video/url`, {
      params: { tags, moods },
    });
  }

}

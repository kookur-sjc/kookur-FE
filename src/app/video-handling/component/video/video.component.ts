import { Component } from '@angular/core';
import { VideoService } from '../../service/video.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, NgModel, NgModelGroup } from '@angular/forms';

@Component({
  selector: 'app-video',
  standalone: true,
  imports: [HttpClientModule, FormsModule],
  providers: [VideoService],
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss'
})
export class VideoComponent {
  moods:string = '';
  tags:string = '';
  selectedFile:File| null = null

      constructor(private uploadService:VideoService){}

      onFileSelected(event:any):void{
        this.selectedFile = event.target.files[0];
      }


      onUploadVideo():void{
        if (!this.selectedFile) {
          alert("Please select a video file.");
          return;
        }

        this.uploadService.uploadVideo(this.selectedFile,this.moods,this.tags);
      }

}

import React, { useEffect, useState } from 'react';

import Image from '../../../components/Image/Image';
import useAxios from '../../../store/useAxios';
import './SinglePost.css';

function SinglePost(props) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState('');
  const [content, setContent] = useState('');
  const api = useAxios();

  useEffect(() => {
    const postId = props.match.params.postId;
    async function getData() {
      try {
        const res = await api.get(`/feed/posts/${postId}`);
        console.log(res);
  
        if (res.status !== 200) {
          throw new Error('Failed to fetch status');
        }

        const resData = res.data;

        setTitle(resData.post.title);
        setAuthor(resData.post.creator.name);
        setImage(resData.post.imageUrl);
        setDate(new Date(resData.post.createdAt).toLocaleDateString('en-US'));
        setContent(resData.post.content);
  
      } catch(err) {
        console.log(err);
      }
    }
    getData();
  }, []); 

    return (
      <section className="single-post">
        <h1>{title}</h1>
        <h2>
          Created by {author} on {date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={image} />
        </div>
        <p>{content}</p>
      </section>
    );
  }

export default SinglePost;

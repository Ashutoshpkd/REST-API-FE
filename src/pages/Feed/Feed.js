import React, { Fragment, useState, useEffect } from 'react';
import openSocket from 'socket.io-client';
import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';
import useAxios, { baseURL } from '../../store/useAxios';

function Feed(props) {
  const [isEditing, setisEditing] = useState(false);
  const [posts, setposts] = useState([]);
  const [totalPosts, settotalPosts] = useState(0);
  const [status, setstatus] = useState('');
  const [postsLoading, setpostsLoading] = useState(true);
  const [editLoading, seteditLoading] = useState(false);
  const [editPost, seteditPost] = useState(null);
  const [postPage, setpostPage] = useState(1);
  const [error, setError] = useState(null);
  const [postPerPage, setPostPerPage]  = useState(3);
  const api = useAxios();

  const loadPosts = direction => {
    if (direction) {
      setpostsLoading(true);
      setposts([]);
    }
    let page = postPage;
    if (direction === 'next') {
      page++;
      setpostPage(page);
    }
    if (direction === 'previous') {
      page--;
      setpostPage(page);
    }
    async function getData() {
      try {
        const res = await api.get(`/feed/posts?page=${page}`);
        if (res.status !== 200) {
          throw new Error('Failed to fetch posts.');
        }
        const newPosts = res.data.posts.map(post => {
          return {
            ...post,
            imagePath: post.imageUrl,
          }
        });
        setposts(newPosts);
        settotalPosts(res.data.totalItems);
        setpostsLoading(false);
        setPostPerPage(res.data.perPage);
      } catch (e) {
        catchError(e);
      }
    }
    getData();
  };

  const statusUpdateHandler = event => {
    event.preventDefault();
    const reqBody = {
      status:  status,
    };
    async function updateStatus() {
      try {
        const res = await api.put(`/user/updatestatus`, reqBody);
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Can't update status!");
        }
        console.log(res.data);
      } catch (e) {
        catchError(e);
      }
    }
    updateStatus();
  };

  const newPostHandler = () => {
    setisEditing(true);
  };

  const startEditPostHandler = postId => {
    const loadedPost = { ...posts.find(p => p._id === postId) };
    seteditPost(loadedPost);
    setisEditing(true);
  };

  const cancelEditHandler = () => {
    setisEditing(false);
    seteditPost(null);
  };

  const finishEditHandler = postData => {
    seteditLoading(true);
    let url = '/feed/post';

    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('images', postData.image);
    if (editPost) {
      url = `${url}/${editPost._id}`;
    }
    async function editHandler() {
      try {
        let res;
        if (editPost) {
          res = await api.put(url, formData, { headers: {'Content-Type': 'multipart/form-data'}});
        } else {
          res = await api.post(url, formData, { headers: {'Content-Type': 'multipart/form-data'}});
        }
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Creating or editing a post failed!');
        }
        const resData = res.data;
        const post = {
          _id: resData.post._id,
          title: resData.post.title,
          content: resData.post.content,
          creator: resData.post.creator,
          createdAt: resData.post.createdAt
        };
        setposts(prevState => {
          let updatedPosts = [...prevState];
          if (editPost) {
            const postIndex = prevState.findIndex(
              p => p._id === editPost._id
            );
            updatedPosts[postIndex] = post;
          } else if (prevState.length < 2) {
            updatedPosts = prevState.concat(post);
          }
          return [...updatedPosts];
        })
        setisEditing(false);
        seteditLoading(false);
        seteditPost(null);
      } catch (err) {
        console.log(err);
        setisEditing(false);
        seteditPost(null);
        seteditLoading(false);
        setError(err);
      }
    }
    editHandler();
  };

  const statusInputChangeHandler = (input, value) => {
    setstatus(value);
  };

  const addPost = (post) => {
    setposts(prevState => {
      const updatedPosts = [...prevState];
      if (postPage === 1) {
        if (prevState.length >= 2) {
          updatedPosts.pop();
        }
        updatedPosts.unshift(post);
      }
      settotalPosts(p => p+1);
      return updatedPosts;
    });
  }

  const deletePostHandler = postId => {
    setpostsLoading(true);
    const url = `/feed/post/${postId}`;
    async function deletePost() {
      try {
        const res = await api.delete(url);
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Deleting a post failed!');
        }
        loadPosts();
      } catch (err) {
        setError(err);
        setpostsLoading(false);
      }
    }
    deletePost();
  };

  const errorHandler = () => {
    setError(null);
  };

  const catchError = err => {
    setError(err);
  };

  const updatePost = newPost => {
    setposts(p => {
      const updated = [...p];
      const idx = updated.findIndex(o => o._id === newPost._id);
      if (idx !== -1) {
        updated[idx] = newPost;
      }
      return updated;
    })
  }

  useEffect(() => {
    async function getData() {
      try {
        const res = await api.get(`/user/status/${props.userId}`);
        if (res.status !== 200) {
          throw new Error('Failed to fetch user status.');
        }
        setstatus(res.data.status);
      } catch (e) {
        catchError(e);
      }
    }
    getData();
    loadPosts();
    const socket = openSocket(baseURL, {transports: ['websocket', 'polling', 'flashsocket']});
    socket.on('post', action => {
      if (action.type === 'create') {
        addPost(action.post);
      } else if (action.type === 'update') {
        updatePost(action.post);
      } else {
        loadPosts();
      }
    })
  }, []); 

    return (
      <Fragment>
        <ErrorHandler error={error} onHandle={errorHandler} />
        <FeedEdit
          editing={isEditing}
          selectedPost={editPost}
          loading={editLoading}
          onCancelEdit={cancelEditHandler}
          onFinishEdit={finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={statusInputChangeHandler}
              value={status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {posts.length <= 0 && !postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!postsLoading && (
            <Paginator
              onPrevious={loadPosts.bind(this, 'previous')}
              onNext={loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(totalPosts / postPerPage)}
              currentPage={postPage}
            >
              {posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={startEditPostHandler.bind(this, post._id)}
                  onDelete={deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }

export default Feed;
